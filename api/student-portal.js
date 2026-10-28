import { getServices } from './_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, crashed, clientIp, withinRate } from './_lib/http.js';
import { calculateNextPaymentDueDate } from '../src/types/schemas.js';

const normalizeName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const activePaymentsOnly = (payments) => payments.filter((p) => !p.isReversed && !p.reversed);

const obligationStatus = (obligation, today) => {
  if (obligation.status === 'waived' || obligation.status === 'cancelled') return obligation.status;
  const balance = Math.max(
    0,
    Number(obligation.amountDue || 0) - Number(obligation.amountPaid || 0) - Number(obligation.waivedAmount || 0)
  );
  if (balance === 0) return 'paid';
  if (Number(obligation.amountPaid || 0) > 0) return 'partially_paid';
  if (obligation.dueDate && today > obligation.dueDate) return 'overdue';
  return 'pending';
};

const findStudentForAccount = async (db, { uid, email, profile }) => {
  const byUid = await db.collection('students').where('studentUid', '==', uid).limit(1).get();
  if (!byUid.empty) return { student: { id: byUid.docs[0].id, ...byUid.docs[0].data() }, matchedBy: 'studentUid' };

  if (email) {
    const byEmail = await db.collection('students').where('email', '==', email).limit(1).get();
    if (!byEmail.empty) return { student: { id: byEmail.docs[0].id, ...byEmail.docs[0].data() }, matchedBy: 'email' };
  }

  const mobile = String(profile?.mobile || '').replace(/\D/g, '').slice(-10);
  if (!mobile) return { student: null, matchedBy: null, reason: 'no_guardian_mobile' };

  const byPhone = await db.collection('students').where('guardianPhone', '==', mobile).get();
  if (byPhone.empty) return { student: null, matchedBy: null, reason: 'no_student_record' };

  const candidates = byPhone.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const wanted = normalizeName(profile?.studentName);
  const exact = candidates.filter((student) => normalizeName(student.studentName) === wanted && wanted);
  if (exact.length !== 1) {
    return {
      student: null,
      matchedBy: null,
      reason: exact.length > 1 ? 'ambiguous_student_record' : 'name_mismatch',
    };
  }

  const student = exact[0];
  if (student.studentUid && student.studentUid !== uid) {
    return { student: null, matchedBy: null, reason: 'account_mismatch' };
  }
  return { student, matchedBy: 'guardianPhone' };
};

const linkAccountToRecords = async (db, { uid, email, student }) => {
  const now = new Date().toISOString();
  const writes = [];
  if (!student.studentUid) {
    writes.push(db.collection('students').doc(student.id).update({ studentUid: uid, updatedAt: now }));
    student.studentUid = uid;
  }

  const targets = [];
  if (student.enrollmentId) {
    const snap = await db.collection('enrollments').doc(student.enrollmentId).get();
    if (snap.exists) targets.push({ id: student.enrollmentId, ...snap.data() });
  }
  if (student.guardianPhone) {
    const snap = await db.collection('enrollments').where('phone', '==', student.guardianPhone).get();
    snap.docs.forEach((doc) => {
      const row = { id: doc.id, ...doc.data() };
      if (targets.some((target) => target.id === doc.id)) return;
      if (normalizeName(row.studentName) !== normalizeName(student.studentName)) return;
      targets.push(row);
    });
  }

  targets.forEach((enrollment) => {
    if (!enrollment.studentUid) {
      writes.push(
        db.collection('enrollments').doc(enrollment.id).update({
          studentUid: uid,
          email: enrollment.email || email || null,
          updatedAt: now,
        })
      );
    }
  });

  if (writes.length) await Promise.all(writes);
};

export default async function handler(req, res) {
  prepare(res, ['GET']);
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed');

  const services = await getServices();
  if (!services) return unavailable(res);
  const { db, auth } = services;

  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return fail(res, 401, 'Sign in to your student account to view this page.');

  try {
    if (!(await withinRate(db, 'student_portal', clientIp(req), 60, 60 * 1000))) {
      return fail(res, 429, 'Too many requests. Please wait a moment and try again.');
    }

    let decoded;
    try {
      decoded = await auth.verifyIdToken(token, true);
    } catch {
      return fail(res, 401, 'Your session is no longer valid. Please sign in again.');
    }

    const uid = decoded.uid;
    const email = String(decoded.email || '').toLowerCase().trim() || null;

    const profileSnap = await db.collection('student_profiles').doc(uid).get();
    const profile = profileSnap.exists ? profileSnap.data() : null;

    const match = await findStudentForAccount(db, { uid, email, profile });
    if (!match.student) {
      return res.status(200).json({
        success: true,
        linked: false,
        reason: match.reason || 'not_linked',
        profile: profile
          ? { studentName: profile.studentName || null, mobile: profile.mobile || null, grade: profile.grade || null }
          : null,
        student: null,
        enrollment: null,
        enrollments: [],
        fee: null,
        obligations: [],
        payments: [],
        syncedAt: new Date().toISOString(),
      });
    }

    const student = match.student;
    await linkAccountToRecords(db, { uid, email, student });

    const [obligationSnap, paymentSnap, enrollmentSnap] = await Promise.all([
      db.collection('fee_obligations').where('studentId', '==', student.id).get(),
      db.collection('payments').where('studentId', '==', student.id).get(),
      db.collection('enrollments').where('studentUid', '==', uid).get(),
    ]);

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const obligations = obligationSnap.docs.map((doc) => {
      const row = { id: doc.id, ...doc.data() };
      const balance = Math.max(
        0,
        Number(row.amountDue || 0) - Number(row.amountPaid || 0) - Number(row.waivedAmount || 0)
      );
      return { ...row, balance, status: obligationStatus(row, today) };
    });

    const payments = paymentSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.paymentDate || b.createdAt || '').localeCompare(String(a.paymentDate || a.createdAt || '')));
    const activePayments = activePaymentsOnly(payments);

    const totalCharged = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
    const totalPaid = activePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalWaived = obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
    const outstanding = Math.max(0, totalCharged - totalPaid - totalWaived);

    const schedule = calculateNextPaymentDueDate({ student, obligations, payments: activePayments });

    const enrollments = enrollmentSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.enrolledAt || '').localeCompare(String(a.enrolledAt || '')));

    const primaryEnrollment = enrollments[0] || null;
    const overdueObligations = obligations.filter((o) => o.status === 'overdue');

    return res.status(200).json({
      success: true,
      linked: true,
      matchedBy: match.matchedBy,
      profile: profile
        ? { studentName: profile.studentName || null, mobile: profile.mobile || null, grade: profile.grade || null }
        : null,
      student: {
        id: student.id,
        studentName: student.studentName,
        grade: student.grade,
        board: student.board,
        batchId: student.batchId,
        batchName: student.batchName,
        status: student.status,
        admissionStatus: student.admissionStatus || (student.status === 'active' ? 'confirmed' : student.status),
        enrollmentDate: student.enrollmentDate || null,
      },
      billing: {
        frequency: student.feeConfig?.billingFrequency || 'monthly',
        amountPerCycle: Number(student.feeConfig?.amountPerCycle || 0),
        billingStartDate: student.feeConfig?.billingStartDate || null,
        configuredNextDueDate: student.feeConfig?.nextDueDate || null,
      },
      fee: {
        currency: 'INR',
        totalCharged,
        totalPaid,
        totalWaived,
        outstanding,
        overdueAmount: schedule.overdueAmount || overdueObligations.reduce((sum, o) => sum + Number(o.balance || 0), 0),
        status: schedule.status,
        dueDate: schedule.dueDate || null,
        isOverdue: Boolean(schedule.isOverdue),
        explanation: schedule.explanation || null,
        paymentStatus: outstanding === 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
      },
      enrollment: primaryEnrollment,
      enrollments,
      obligations,
      payments,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return crashed(res, 'student-portal', err);
  }
}
