import { getServices } from './_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, crashed, clean, cleanPhone, clientIp, newId, withinRate } from './_lib/http.js';
import { readToken } from './_lib/stepToken.js';
import { isBatchCompatible } from '../src/types/schemas.js';

const VALID_PHONE = /^[6-9]\d{9}$/;
const VALID_PINCODE = /^[1-9]\d{5}$/;
const VALID_GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const ACADEMIC_SESSION = '2025-2026';

const normalizeName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const dateStr = (input = new Date()) => (input instanceof Date ? input : new Date(input)).toISOString().split('T')[0];
const shiftDate = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const monthCycle = (input = new Date()) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(input);

const sanitizeId = (value, max = 40) => String(value || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, max);
const sanitizeKey = (value, max = 80) => String(value || '').replace(/[^\w:.-]/g, '').slice(0, max);

async function findExistingSubmission(db, { enrollmentId, idempotencyKey, phone, studentName, batchId }) {
  if (idempotencyKey) {
    const snap = await db.collection('leads').where('idempotencyKey', '==', idempotencyKey).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { record: { ...doc.data(), id: doc.id }, reason: 'idempotency_key' };
    }
  }

  if (enrollmentId) {
    const leadSnap = await db.collection('leads').doc(enrollmentId).get();
    if (leadSnap.exists && leadSnap.data().source === 'enrollment') {
      return { record: { ...leadSnap.data(), id: leadSnap.id }, reason: 'enrollment_id' };
    }
    const enrollmentSnap = await db.collection('enrollments').doc(enrollmentId).get();
    if (enrollmentSnap.exists) {
      return { record: { id: enrollmentId, ...enrollmentSnap.data() }, reason: 'enrollment_id' };
    }
    if (leadSnap.exists) {
      return { conflict: true };
    }
  }

  if (phone && studentName) {
    const snap = await db.collection('leads').where('phone', '==', phone).get();
    const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
    const match = snap.docs.find((doc) => {
      const lead = doc.data();
      if (lead.source !== 'enrollment') return false;
      if (normalizeName(lead.studentName) !== normalizeName(studentName)) return false;
      if (batchId && lead.batchId && lead.batchId !== batchId) return false;
      const stamp = Date.parse(lead.timestamp || lead.submittedAt || '');
      return Number.isFinite(stamp) ? stamp >= cutoff : false;
    });
    if (match) {
      return { record: { ...match.data(), id: match.id }, reason: 'recent_enrollment' };
    }
  }

  return null;
}

async function finalizeEnrollment(db, { record, waitlisted }) {
  const enrollmentId = record.id;
  const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
  const existingEnrollment = await enrollmentRef.get();
  if (existingEnrollment.exists) {
    return { ...(existingEnrollment.data() || {}), id: enrollmentId, alreadyFinalized: true };
  }

  const batchId = record.batchId;
  const batchSnap = batchId ? await db.collection('batches').doc(batchId).get() : null;
  const batch = batchSnap && batchSnap.exists ? batchSnap.data() : null;
  const now = new Date().toISOString();

  const enrollmentDoc = {
    id: enrollmentId,
    enrollmentId,
    leadId: record.id,
    studentUid: record.studentUid,
    email: record.email,
    studentName: record.studentName,
    parentName: record.parentName,
    phone: record.phone,
    whatsappNumber: record.whatsappNumber,
    secondaryPhone: record.secondaryPhone,
    grade: record.grade,
    board: record.board,
    batchId: record.batchId,
    batchName: clean(batch?.name || record.batchName || record.subjects, 120) || null,
    timing: record.timing,
    subjects: record.subjects,
    reservationId: record.reservationId,
    status: waitlisted ? 'waitlisted' : 'confirmed',
    enrolledAt: record.timestamp,
    updatedAt: record.timestamp,
    source: 'enrollment',
    feeStatus: 'not_applicable',
    paymentStatus: 'unpaid',
    schoolName: record.schoolName,
    educationBoard: record.educationBoard,
    targetYear: record.targetYear,
    previousScore: record.previousScore,
    schoolShift: record.schoolShift,
    schoolDismissalTime: record.schoolDismissalTime,
    travelDurationMinutes: record.travelDurationMinutes,
    scheduleClashWarning: record.scheduleClashWarning,
    mediumOfInstruction: record.mediumOfInstruction,
    emergencyContactName: record.emergencyContactName,
    emergencyPhone: record.emergencyPhone,
    emergencyRelationship: record.emergencyRelationship,
    medicalAlert: record.medicalAlert,
    studentIdNumber: record.studentIdNumber,
    addressStreet: record.addressStreet,
    addressLandmark: record.addressLandmark,
    addressCityState: record.addressCityState,
    addressPincode: record.addressPincode
  };

  if (waitlisted) {
    enrollmentDoc.waitlistNote = 'Seat waitlisted. Student registration and fee obligation are created only after a seat is confirmed.';
    await enrollmentRef.set(enrollmentDoc);
    return enrollmentDoc;
  }

  let existingStudent = null;
  const linkedSnap = await db.collection('students').where('enrollmentId', '==', enrollmentId).limit(1).get();
  if (!linkedSnap.empty) {
    const doc = linkedSnap.docs[0];
    existingStudent = { id: doc.id, ...doc.data() };
  } else if (record.phone) {
    const phoneSnap = await db.collection('students').where('guardianPhone', '==', record.phone).get();
    const sameStudent = phoneSnap.docs.find((doc) => normalizeName(doc.data().studentName) === normalizeName(record.studentName));
    if (sameStudent) {
      existingStudent = { id: sameStudent.id, ...sameStudent.data() };
    }
  }

  if (existingStudent) {
    enrollmentDoc.studentId = existingStudent.id;
    enrollmentDoc.linkedExistingStudent = true;
    enrollmentDoc.linkNote = `Matched existing roster record ${existingStudent.id}. Verify the batch assignment before collecting fees.`;
    enrollmentDoc.feeStatus = 'not_applicable';
    await enrollmentRef.set(enrollmentDoc);
    return enrollmentDoc;
  }

  if (!batch) {
    enrollmentDoc.status = 'pending';
    enrollmentDoc.reviewReason = 'Selected batch could not be found. Review this enrollment before registering the student.';
    await enrollmentRef.set(enrollmentDoc);
    return enrollmentDoc;
  }

  const capacity = Math.max(1, Number(batch.capacity) || 12);
  const enrolledCount = Number(batch.enrolledCount) || 0;
  if (enrolledCount >= capacity) {
    enrollmentDoc.status = 'pending';
    enrollmentDoc.reviewReason = `Batch '${batch.name}' is at capacity (${enrolledCount}/${capacity}). Review required before student registration.`;
    await enrollmentRef.set(enrollmentDoc);
    return enrollmentDoc;
  }

  const year = new Date().getFullYear();
  const admissionCounterRef = db.collection('counters').doc(`admissions-${year}`);
  const obligationId = `OBL-${sanitizeId(enrollmentId, 32)}-${String(year)}`;
  const nextDueDate = dateStr(shiftDate(30));
  const amountDue = Math.max(0, Number(batch.monthlyFee) || 0);

  const result = await db.runTransaction(async (tx) => {
    const [counterSnap, batchLiveSnap, obligationSnap] = await Promise.all([
      tx.get(admissionCounterRef),
      tx.get(db.collection('batches').doc(batchId)),
      tx.get(db.collection('fee_obligations').doc(obligationId))
    ]);
    const liveBatch = batchLiveSnap.exists ? batchLiveSnap.data() : batch;
    const liveCapacity = Math.max(1, Number(liveBatch.capacity) || 12);
    const liveEnrolled = Number(liveBatch.enrolledCount) || 0;
    if (liveEnrolled >= liveCapacity) {
      return { status: 'pending', reviewReason: `Batch '${liveBatch.name}' filled while this enrollment was being processed.` };
    }

    let counterValue = Number(counterSnap.exists ? counterSnap.data().value : 0) || 0;
    let studentId = null;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      counterValue += 1;
      const candidate = `FA-${year}-${String(counterValue).padStart(3, '0')}`;
      const candidateSnap = await tx.get(db.collection('students').doc(candidate));
      if (!candidateSnap.exists) {
        studentId = candidate;
        break;
      }
    }
    if (!studentId) {
      return { status: 'pending', reviewReason: 'Could not allocate a unique admission ID. Review this enrollment manually.' };
    }

    const studentDoc = {
      id: studentId,
      studentName: record.studentName,
      guardianName: record.parentName || 'Parent / Guardian',
      guardianPhone: record.phone,
      secondaryPhone: record.secondaryPhone || null,
      emergencyContactName: record.emergencyContactName || null,
      medicalAlert: record.medicalAlert || null,
      schoolShift: record.schoolShift || null,
      schoolDismissalTime: record.schoolDismissalTime || null,
      travelDurationMinutes: record.travelDurationMinutes !== null && record.travelDurationMinutes !== undefined
        ? Number(record.travelDurationMinutes)
        : null,
      scheduleClashWarning: record.scheduleClashWarning || null,
      grade: record.grade,
      board: record.board,
      academicSession: ACADEMIC_SESSION,
      batchId: liveBatch.id || batchId,
      batchName: liveBatch.name,
      enrollmentDate: dateStr(record.timestamp),
      courseEndDate: null,
      status: 'active',
      notificationPreferences: {
        communicationConsent: true,
        preferredChannel: 'whatsapp',
        remindersDisabled: false,
        reminderDisabledReason: ''
      },
      feeConfig: {
        billingFrequency: 'monthly',
        amountPerCycle: amountDue,
        discountAdjustment: 0,
        adjustmentHistory: [],
        billingStartDate: dateStr(record.timestamp),
        nextDueDate,
        status: 'active'
      },
      enrollmentId,
      leadId: record.id,
      studentUid: record.studentUid || null,
      reservationId: record.reservationId || null,
      source: 'online_enrollment',
      createdAt: now,
      updatedAt: now
    };

    const obligationExists = obligationSnap.exists;
    const obligationDoc = obligationExists
      ? obligationSnap.data()
      : {
          id: obligationId,
          studentId,
          studentName: record.studentName,
          batchId: liveBatch.id || batchId,
          billingCycle: monthCycle(),
          dueDate: nextDueDate,
          amountDue,
          amountPaid: 0,
          waivedAmount: 0,
          balance: amountDue,
          status: 'pending',
          notes: 'Created automatically from the online enrollment form. No payment has been received yet.',
          enrollmentId,
          createdAt: now,
          updatedAt: now
        };

    tx.set(admissionCounterRef, { value: counterValue, updatedAt: now });
    tx.set(db.collection('students').doc(studentId), studentDoc);
    if (!obligationExists) tx.set(db.collection('fee_obligations').doc(obligationId), obligationDoc);

    tx.update(db.collection('batches').doc(batchId), {
      enrolledCount: liveEnrolled + 1,
      seatsRemaining: Math.max(0, liveCapacity - liveEnrolled - 1),
      updatedAt: now
    });

    if (record.reservationId) {
      const reservationSnap = await db.collection('reservations').where('reservationId', '==', record.reservationId).limit(1).get();
      const reservation = reservationSnap.empty ? null : reservationSnap.docs[0];
      if (reservation && reservation.data().phone === record.phone) {
        const status = reservation.data().status;
        if (status === 'held' || status === 'confirmed') {
          tx.update(reservation.ref, { status: 'enrolled', enrolledAt: now });
        }
      }
    }

    return { status: 'confirmed', studentId, obligationDoc };
  });

  if (result.status !== 'confirmed') {
    enrollmentDoc.status = 'pending';
    enrollmentDoc.reviewReason = result.reviewReason;
    await enrollmentRef.set(enrollmentDoc);
    return enrollmentDoc;
  }

  enrollmentDoc.studentId = result.studentId;
  enrollmentDoc.feeObligationId = obligationId;
  enrollmentDoc.feeStatus = 'pending';
  enrollmentDoc.paymentStatus = 'unpaid';
  enrollmentDoc.paymentNote = 'No payment gateway is connected to this form. Fees stay unpaid until an administrator records a verified transaction.';
  await enrollmentRef.set(enrollmentDoc);
  return enrollmentDoc;
}

export default async function handler(req, res) {
  prepare(res, ['POST']);
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

  const services = await getServices();
  if (!services) return unavailable(res);
  const { db } = services;

  try {
    if (!(await withinRate(db, 'lead', clientIp(req), 10, 60 * 1000))) {
      return fail(res, 429, 'Too many inquiries from this connection. Please wait a minute before submitting again.');
    }

    const body = req.body && typeof req.body === 'object' ? req.body : null;
    if (!body || JSON.stringify(body).length > 8192) return fail(res, 413, 'Payload size exceeds limit');

    if (body.website_url || body.faxNumber || body.company_fax) {
      return fail(res, 400, 'Automated submission rejected.');
    }

    const studentName = clean(body.studentName, 80);
    const phone = cleanPhone(body.phone);
    if (studentName.length < 2) return fail(res, 400, 'Valid student name is required');
    if (!VALID_PHONE.test(phone)) return fail(res, 400, 'Valid 10-digit Indian mobile number is required');

    const whatsappNumber = body.whatsappNumber ? cleanPhone(body.whatsappNumber) : phone;
    if (body.whatsappNumber && !VALID_PHONE.test(whatsappNumber)) {
      return fail(res, 400, 'Valid 10-digit WhatsApp number is required');
    }

    const emergencyPhone = body.emergencyPhone ? cleanPhone(body.emergencyPhone) : null;
    if (body.emergencyPhone && !VALID_PHONE.test(emergencyPhone)) {
      return fail(res, 400, 'Valid 10-digit emergency contact phone is required');
    }

    const cleanPin = body.addressPincode ? clean(body.addressPincode, 10).replace(/\s+/g, '') : null;
    if (cleanPin && !VALID_PINCODE.test(cleanPin)) {
      return fail(res, 400, 'Valid 6-digit Indian PIN code is required');
    }

    const cleanGst = body.gstin ? clean(body.gstin, 20).toUpperCase() : null;
    if (cleanGst && !VALID_GSTIN.test(cleanGst)) {
      return fail(res, 400, 'Invalid GSTIN format');
    }

    if (body.reservationId) {
      if (body.schoolName && clean(body.schoolName, 120).length < 2) {
        return fail(res, 400, 'Valid school or college name is required');
      }
    }

    const idempotencyKey = sanitizeKey(req.headers['idempotency-key'] || body.idempotencyKey);
    const requestedEnrollmentId = sanitizeId(body.enrollmentId);
    const isEnrollmentSubmission = Boolean(body.reservationId);

    const existing = await findExistingSubmission(db, {
      enrollmentId: isEnrollmentSubmission ? requestedEnrollmentId : '',
      idempotencyKey,
      phone,
      studentName,
      batchId: clean(body.batchId, 60) || null
    });

    if (existing && !existing.conflict) {
      const stored = existing.record;
      if (stored.source === 'enrollment') {
        try {
          const proof = readToken(String(body.stepToken || ''));
          const reservationRef = proof
            ? db.collection('reservations').doc(`${proof.applicationId}__${clean(body.batchId, 60)}`)
            : null;
          const reservationSnap = reservationRef ? await reservationRef.get() : null;
          const waitlisted = Boolean(reservationSnap && reservationSnap.exists && reservationSnap.data().status === 'waitlist');
          await finalizeEnrollment(db, { record: { ...stored, timestamp: stored.timestamp || stored.enrolledAt || new Date().toISOString() }, waitlisted });
        } catch (healErr) {
          console.warn('[api:leads] duplicate healing failed:', healErr?.code || healErr?.name || 'unknown');
        }
      }
      return res.status(200).json({
        success: true,
        duplicate: true,
        data: stored,
        meta: {
          id: stored.id,
          duplicate: true,
          duplicateReason: existing.reason,
          receivedAt: stored.timestamp || stored.enrolledAt || new Date().toISOString()
        }
      });
    }

    const record = {
      id: requestedEnrollmentId && !existing?.conflict ? requestedEnrollmentId : newId('FA'),
      timestamp: new Date().toISOString(),
      studentName,
      parentName: clean(body.parentName, 80),
      phone,
      whatsappNumber,
      secondaryPhone: body.secondaryPhone ? cleanPhone(body.secondaryPhone) : null,
      medicalAlert: clean(body.medicalAlert, 150) || null,
      schoolName: clean(body.schoolName, 120) || null,
      educationBoard: clean(body.educationBoard || body.board, 60) || null,
      targetYear: clean(body.targetYear, 10) || null,
      previousScore: clean(body.previousScore, 30) || null,
      schoolShift: clean(body.schoolShift, 60) || null,
      schoolDismissalTime: clean(body.schoolDismissalTime, 10) || null,
      travelDurationMinutes: body.travelDurationMinutes !== undefined && body.travelDurationMinutes !== null && body.travelDurationMinutes !== '' && !isNaN(body.travelDurationMinutes) ? Math.min(Math.max(0, parseInt(body.travelDurationMinutes, 10)), 300) : null,
      scheduleClashWarning: clean(body.scheduleClashWarning, 250) || null,
      mediumOfInstruction: clean(body.mediumOfInstruction, 40) || null,
      emergencyContactName: clean(body.emergencyContactName, 80) || null,
      emergencyRelationship: clean(body.emergencyRelationship, 40) || null,
      emergencyPhone,
      studentIdNumber: clean(body.studentIdNumber, 50) || null,
      gstin: cleanGst,
      addressStreet: clean(body.addressStreet, 150) || null,
      addressLandmark: clean(body.addressLandmark, 100) || null,
      addressCityState: clean(body.addressCityState, 100) || null,
      addressPincode: cleanPin,
      grade: clean(body.grade, 50),
      board: clean(body.board, 60),
      batchId: clean(body.batchId, 60) || null,
      reservationId: null,
      timing: clean(body.timing, 50) || null,
      subjects: clean(body.subjects, 150),
      notes: clean(body.notes, 500),
      studentUid: clean(body.studentUid, 128) || null,
      email: clean(body.email, 120) || null,
      source: isEnrollmentSubmission ? 'enrollment' : 'inquiry',
      status: 'new',
      idempotencyKey: idempotencyKey || null,
      campus: 'Thoramangalam, Perambalur'
    };

    let waitlisted = false;
    if (isEnrollmentSubmission) {
      const proof = readToken(String(body.stepToken || ''));
      if (!proof || proof.step < 4) return fail(res, 401, 'Your admission session could not be verified.');
      const reservationRef = db.collection('reservations').doc(`${proof.applicationId}__${record.batchId}`);
      const confirmed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(reservationRef);
        if (!snap.exists) return null;
        const r = snap.data();
        const live = r.status === 'confirmed' || Date.parse(r.expiresAt) > Date.now();
        if (r.reservationId !== clean(body.reservationId, 40) || r.phone !== phone || !live || r.status === 'released') return null;
        if (r.status === 'waitlist') {
          waitlisted = true;
          return r.reservationId;
        }
        tx.update(reservationRef, { status: 'confirmed', confirmedAt: new Date().toISOString() });
        return r.reservationId;
      });
      if (!confirmed) return fail(res, 409, 'Your seat hold expired. Please select the batch again.');
      record.reservationId = confirmed;
      record.enrollmentStatus = waitlisted ? 'waitlisted' : 'confirmed';
      record.status = waitlisted ? 'new' : 'converted';
    }

    if (record.batchId && record.grade) {
      const batchSnap = await db.collection('batches').doc(record.batchId).get();
      if (batchSnap.exists && !isBatchCompatible(batchSnap.data(), record.grade, record.board)) {
        return fail(res, 422, `Academic mismatch: this batch is not available for ${record.grade} (${record.board || 'All'}).`);
      }
    }

    await db.collection('leads').doc(record.id).set(record);

    let enrollment = null;
    if (record.source === 'enrollment') {
      enrollment = await finalizeEnrollment(db, { record, waitlisted });
    }

    let deliveryStatus = 'stored';
    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
          signal: controller.signal
        });
        clearTimeout(timer);
        deliveryStatus = response.ok ? 'stored_and_forwarded' : 'stored_forward_failed';
      } catch {
        deliveryStatus = 'stored_forward_failed';
      }
    }

    return res.status(200).json({
      success: true,
      data: { ...record, ...(enrollment || {}) },
      meta: {
        id: record.id,
        receivedAt: record.timestamp,
        delivery: deliveryStatus,
        duplicate: false,
        enrollmentId: record.source === 'enrollment' ? record.id : null,
        studentId: enrollment?.studentId || null,
        feeObligationId: enrollment?.feeObligationId || null,
        enrollmentStatus: enrollment?.status || null
      }
    });
  } catch (err) {
    return crashed(res, 'leads', err);
  }
}