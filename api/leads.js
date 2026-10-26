import { getServices } from './_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, crashed, clean, cleanPhone, clientIp, newId, withinRate } from './_lib/http.js';
import { readToken } from './_lib/stepToken.js';
import { isBatchCompatible } from '../src/types/schemas.js';

const VALID_PHONE = /^[6-9]\d{9}$/;
const VALID_PINCODE = /^[1-9]\d{5}$/;
const VALID_GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

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

    const record = {
      id: newId('FA'),
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
      source: body.reservationId ? 'enrollment' : 'inquiry',
      status: 'new',
      campus: 'Thoramangalam, Perambalur',
    };

    if (body.reservationId) {
      const proof = readToken(String(body.stepToken || ''));
      if (!proof || proof.step < 4) return fail(res, 401, 'Your admission session could not be verified.');
      const reservationRef = db.collection('reservations').doc(`${proof.applicationId}__${record.batchId}`);
      const confirmed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(reservationRef);
        if (!snap.exists) return null;
        const r = snap.data();
        const live = r.status === 'confirmed' || Date.parse(r.expiresAt) > Date.now();
        if (r.reservationId !== clean(body.reservationId, 40) || r.phone !== phone || !live || r.status === 'released') return null;
        tx.update(reservationRef, { status: 'confirmed', confirmedAt: new Date().toISOString() });
        return r.reservationId;
      });
      if (!confirmed) return fail(res, 409, 'Your seat hold expired. Please select the batch again.');
      record.reservationId = confirmed;
    }

    if (record.batchId && record.grade) {
      const batchSnap = await db.collection('batches').doc(record.batchId).get();
      if (batchSnap.exists && !isBatchCompatible(batchSnap.data(), record.grade, record.board)) {
        return fail(res, 422, `Academic mismatch: this batch is not available for ${record.grade} (${record.board || 'All'}).`);
      }
    }

    await db.collection('leads').doc(record.id).set(record);

    if (record.source === 'enrollment') {
      const enrollmentDoc = {
        id: record.id,
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
        batchName: clean(body.selectedBatchName || body.batchName || body.subjects, 120) || null,
        timing: record.timing,
        subjects: record.subjects,
        reservationId: record.reservationId,
        status: 'confirmed',
        enrolledAt: record.timestamp,
        updatedAt: record.timestamp,
        schoolName: record.schoolName,
        educationBoard: record.educationBoard,
        targetYear: record.targetYear,
        schoolShift: record.schoolShift,
        schoolDismissalTime: record.schoolDismissalTime,
        travelDurationMinutes: record.travelDurationMinutes,
        scheduleClashWarning: record.scheduleClashWarning,
        emergencyContactName: record.emergencyContactName,
        emergencyPhone: record.emergencyPhone,
        emergencyRelationship: record.emergencyRelationship,
        medicalAlert: record.medicalAlert,
        studentIdNumber: record.studentIdNumber,
        addressStreet: record.addressStreet,
        addressCityState: record.addressCityState,
        addressPincode: record.addressPincode,
      };
      await db.collection('enrollments').doc(record.id).set(enrollmentDoc);
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
          signal: controller.signal,
        });
        clearTimeout(timer);
        deliveryStatus = response.ok ? 'stored_and_forwarded' : 'stored_forward_failed';
      } catch {
        deliveryStatus = 'stored_forward_failed';
      }
    }

    return res.status(200).json({
      success: true,
      data: record,
      meta: {
        id: record.id,
        receivedAt: record.timestamp,
        delivery: deliveryStatus,
      },
    });
  } catch (err) {
    return crashed(res, 'leads', err);
  }
}
