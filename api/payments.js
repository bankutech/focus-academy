import { getServices } from './_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, crashed, clean, clientIp, withinRate, newId } from './_lib/http.js';
import { authenticateAdmin } from './_lib/adminAuth.js';
import { calculateNextPaymentDueDate } from '../src/types/schemas.js';

const APPROVED_METHODS = ['cash', 'upi_online', 'bank_transfer', 'card', 'cheque', 'demand_draft'];
const normalizeMethod = (value, fallback = 'cash') => {
  const method = String(value || fallback).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases = { upi: 'upi_online', gpay: 'upi_online', phonepe: 'upi_online', bank: 'bank_transfer', neft: 'bank_transfer', imps: 'bank_transfer', dd: 'demand_draft' };
  const resolved = aliases[method] || method;
  return APPROVED_METHODS.includes(resolved) ? resolved : null;
};

export default async function handler(req, res) {
  prepare(res, ['GET', 'POST']);

  const services = await getServices();
  if (!services) return unavailable(res);
  const { db, auth } = services;

  if (req.method === 'POST') {
    // Recording money is an authorised desk operation. Without this check any anonymous
    // caller could credit a payment against a real student's fee obligation.
    const actor = await authenticateAdmin(req, services, { permission: 'canRecordPayments' });
    if (!actor.ok) return fail(res, actor.status, actor.error);
    req.adminActor = actor;
  }

  try {
    if (!(await withinRate(db, 'payments_api', clientIp(req), 60, 60 * 1000))) {
      return fail(res, 429, 'Rate limit exceeded. Please wait a moment.');
    }

    if (req.method === 'GET') {
      const authHeader = String(req.headers.authorization || '');
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      let decoded = null;
      if (token) {
        try {
          decoded = await auth.verifyIdToken(token);
        } catch {
        }
      }

      const adminCheck = await authenticateAdmin(req, services, { permission: 'canRecordPayments' });
      const isAdmin = adminCheck.ok;

      let queryRef = db.collection('payments');
      const studentId = clean(req.query.studentId, 60);

      if (isAdmin) {
        if (studentId) {
          queryRef = queryRef.where('studentId', '==', studentId);
        }
      } else if (decoded && decoded.uid) {
        let matchedStudentId = studentId;
        if (!matchedStudentId) {
          const studentSnap = await db.collection('students').where('studentUid', '==', decoded.uid).limit(1).get();
          if (!studentSnap.empty) {
            matchedStudentId = studentSnap.docs[0].id;
          }
        }
        if (!matchedStudentId) {
          const profileSnap = await db.collection('student_profiles').doc(decoded.uid).get();
          if (profileSnap.exists && profileSnap.data().mobile) {
            const phoneStudentSnap = await db.collection('students').where('guardianPhone', '==', profileSnap.data().mobile).limit(1).get();
            if (!phoneStudentSnap.empty) {
              matchedStudentId = phoneStudentSnap.docs[0].id;
            }
          }
        }

        if (matchedStudentId) {
          queryRef = queryRef.where('studentId', '==', matchedStudentId);
        } else {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
      } else {
        return fail(res, 401, 'Authentication required to retrieve payment records.');
      }

      const snap = await queryRef.get();
      const records = [];
      snap.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });

      records.sort((a, b) => new Date(b.createdAt || b.paymentDate || 0) - new Date(a.createdAt || a.paymentDate || 0));

      return res.status(200).json({
        success: true,
        count: records.length,
        data: records
      });
    }

    if (req.method === 'POST') {
      const action = clean(req.query.action || req.body?.action, 30);

      if (action === 'initiate') {
        const obligationId = clean(req.body?.obligationId, 80);
        if (!obligationId) {
          return fail(res, 400, 'Fee obligation ID is required to initiate payment.');
        }

        const oblRef = db.collection('fee_obligations').doc(obligationId);
        const oblSnap = await oblRef.get();
        if (!oblSnap.exists) {
          return fail(res, 404, `Fee obligation '${obligationId}' was not found.`);
        }

        const oblData = oblSnap.data();
        const balance = Math.max(0, Number(oblData.balance ?? (Number(oblData.amountDue || 0) - Number(oblData.amountPaid || 0) - Number(oblData.waivedAmount || 0))));

        if (balance <= 0) {
          return fail(res, 400, 'This fee obligation has already been settled in full.');
        }

        const requestedAmount = req.body?.amount ? Number(req.body.amount) : balance;
        if (isNaN(requestedAmount) || requestedAmount <= 0) {
          return fail(res, 400, 'Invalid payment amount specified.');
        }
        if (requestedAmount > balance) {
          return fail(res, 400, `Requested payment amount (₹${requestedAmount}) exceeds the remaining balance of ₹${balance}.`);
        }

        const method = normalizeMethod(req.body?.paymentMethod, 'upi_online');
        if (!method) return fail(res, 400, 'Select an approved collection method.');

        const referenceId = newId('PAY-INTENT');
        const now = new Date().toISOString();

        await db.collection('payment_intents').doc(referenceId).set({
          referenceId,
          obligationId,
          studentId: oblData.studentId,
          studentName: oblData.studentName,
          amount: requestedAmount,
          currency: 'INR',
          status: 'pending',
          paymentMethod: method,
          createdAt: now,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        });

        return res.status(200).json({
          success: true,
          referenceId,
          obligationId,
          studentId: oblData.studentId,
          studentName: oblData.studentName,
          amount: requestedAmount,
          currency: 'INR',
          status: 'pending'
        });
      }

      if (action === 'verify') {
        const referenceId = clean(req.body?.referenceId, 80);
        const providerRef = clean(req.body?.providerRef || req.body?.gatewayTransactionId || referenceId, 100);
        const obligationId = clean(req.body?.obligationId, 80);

        if (!obligationId && !referenceId) {
          return fail(res, 400, 'Reference ID or Obligation ID is required for verification.');
        }

        return await db.runTransaction(async (tx) => {
          if (providerRef) {
            const existingQuery = await tx.get(db.collection('payments').where('referenceNumber', '==', providerRef).limit(1));
            if (!existingQuery.empty) {
              const existing = existingQuery.docs[0].data();
              return res.status(200).json({
                success: true,
                verified: true,
                idempotent: true,
                receiptNumber: existing.receiptNumber,
                payment: existing
              });
            }
          }

          let oblRef = null;
          let intentData = null;

          if (referenceId) {
            const intentDoc = await tx.get(db.collection('payment_intents').doc(referenceId));
            if (intentDoc.exists) {
              intentData = intentDoc.data();
              oblRef = db.collection('fee_obligations').doc(intentData.obligationId);
            }
          }

          if (!oblRef && obligationId) {
            oblRef = db.collection('fee_obligations').doc(obligationId);
          }

          if (!oblRef) {
            return fail(res, 404, 'Associated fee obligation not found.');
          }

          const oblSnap = await tx.get(oblRef);
          if (!oblSnap.exists) {
            return fail(res, 404, 'Associated fee obligation not found.');
          }

          const obligation = oblSnap.data();
          const currentBalance = Math.max(0, Number(obligation.amountDue || 0) - Number(obligation.amountPaid || 0) - Number(obligation.waivedAmount || 0));

          const verifiedAmount = intentData?.amount || Number(req.body?.amount) || currentBalance;
          if (verifiedAmount <= 0) {
            return fail(res, 400, 'Verified payment amount must be greater than zero.');
          }
          if (verifiedAmount > currentBalance) {
            return fail(res, 400, `Verified amount (₹${verifiedAmount}) exceeds obligation balance (₹${currentBalance}).`);
          }

          const year = new Date().getFullYear();
          const counterRef = db.collection('counters').doc(`receipts-${year}`);
          const counterSnap = await tx.get(counterRef);
          const nextReceiptNum = (counterSnap.exists ? Number(counterSnap.data().value || 0) : 0) + 1;
          const receiptNumber = `REC-${year}-${String(nextReceiptNum).padStart(4, '0')}`;
          const paymentId = newId('TXN');
          const now = new Date().toISOString();

          const paymentMethod = normalizeMethod(req.body?.paymentMethod || intentData?.paymentMethod, 'cash');
          if (!paymentMethod) return fail(res, 400, 'Select an approved collection method.');

          const newPayment = {
            id: paymentId,
            receiptNumber,
            studentId: obligation.studentId,
            studentName: obligation.studentName,
            batchId: obligation.batchId,
            obligationId: obligation.id,
            enrollmentId: clean(req.body?.enrollmentId || obligation.enrollmentId || '', 80) || null,
            amount: verifiedAmount,
            currency: 'INR',
            paymentDate: now.split('T')[0],
            paymentMethod,
            referenceNumber: providerRef || referenceId || newId('REF'),
            gatewayTransactionId: providerRef || referenceId,
            verificationStatus: 'verified_by_staff',
            status: 'verified',
            receiptStatus: 'issued',
            refundStatus: 'none',
            recordedBy: req.adminActor.email,
            notes: clean(req.body?.notes || 'Recorded at the fee desk by an authorised administrator', 200),
            createdAt: now
          };

          const amountPaid = (Number(obligation.amountPaid) || 0) + verifiedAmount;
          const newBalance = Math.max(0, Number(obligation.amountDue || 0) - amountPaid - Number(obligation.waivedAmount || 0));
          const updatedObligation = {
            ...obligation,
            amountPaid,
            balance: newBalance,
            status: newBalance === 0 ? 'paid' : 'partially_paid',
            updatedAt: now
          };

          tx.set(db.collection('payments').doc(paymentId), newPayment);
          tx.set(oblRef, updatedObligation);
          tx.set(counterRef, { value: nextReceiptNum });

          if (referenceId) {
            tx.update(db.collection('payment_intents').doc(referenceId), {
              status: 'completed',
              completedAt: now,
              receiptNumber
            });
          }

          if (obligation.studentId) {
            const studentRef = db.collection('students').doc(obligation.studentId);
            const [studentSnap, obligationListSnap, paymentListSnap] = await Promise.all([
              tx.get(studentRef),
              tx.get(db.collection('fee_obligations').where('studentId', '==', obligation.studentId)),
              tx.get(db.collection('payments').where('studentId', '==', obligation.studentId))
            ]);
            if (studentSnap.exists) {
              const student = studentSnap.data();
              const ledgerObligations = obligationListSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .map((row) => (row.id === obligation.id ? updatedObligation : row));
              const ledgerPayments = paymentListSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
              ledgerPayments.push(newPayment);
              const schedule = calculateNextPaymentDueDate({
                student,
                obligations: ledgerObligations,
                payments: ledgerPayments
              });
              tx.set(studentRef, {
                feeConfig: {
                  ...(student.feeConfig || {}),
                  lastPaymentDate: newPayment.paymentDate,
                  lastPaymentAmount: verifiedAmount,
                  nextDueDate: schedule.dueDate || student.feeConfig?.nextDueDate || null
                },
                updatedAt: now
              }, { merge: true });
            }
          }

          const targetEnrollmentId = newPayment.enrollmentId || obligation.enrollmentId;
          if (targetEnrollmentId) {
            const enrRef = db.collection('enrollments').doc(targetEnrollmentId);
            const enrSnap = await tx.get(enrRef);
            if (enrSnap.exists) {
              tx.update(enrRef, {
                paymentStatus: newBalance === 0 ? 'paid' : 'partial',
                amountPaid: amountPaid,
                paymentReference: receiptNumber,
                updatedAt: now
              });
            }
          }

          const auditId = newId('AUDIT');
          tx.set(db.collection('audit_logs').doc(auditId), {
            id: auditId,
            actor: req.adminActor.email,
            action: 'PAYMENT_RECORDED',
            entityType: 'payment',
            entityId: paymentId,
            details: `Recorded ₹${verifiedAmount} for '${obligation.studentName}' (${obligation.billingCycle || 'Tuition'}) via ${paymentMethod}. Receipt: ${receiptNumber}`,
            timestamp: now
          });

          return res.status(200).json({
            success: true,
            verified: true,
            receiptNumber,
            payment: newPayment,
            obligation: updatedObligation
          });
        });
      }

      return fail(res, 400, "Invalid payment action. Use 'initiate' or 'verify'.");
    }

    return fail(res, 405, 'Method not allowed.');
  } catch (err) {
    return crashed(res, 'payments', err);
  }
}
