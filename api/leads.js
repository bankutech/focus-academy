import { getServices } from './_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, clean, cleanPhone, clientIp, newId, withinRate } from './_lib/http.js';
import { readToken } from './_lib/stepToken.js';
import { isBatchCompatible } from '../src/types/schemas.js';

const VALID_PHONE = /^[6-9]\d{9}$/;

export default async function handler(req, res) {
  prepare(res, ['POST']);
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

  const services = getServices();
  if (!services) return unavailable(res);
  const { db } = services;

  try {
    if (!(await withinRate(db, 'lead', clientIp(req), 10, 60 * 1000))) {
      return fail(res, 429, 'Too many inquiries from this connection. Please wait a minute before submitting again.');
    }

    const body = req.body && typeof req.body === 'object' ? req.body : null;
    if (!body || JSON.stringify(body).length > 8192) return fail(res, 413, 'Payload size exceeds limit');

    const studentName = clean(body.studentName, 80);
    const phone = cleanPhone(body.phone);
    if (studentName.length < 2) return fail(res, 400, 'Valid student name is required');
    if (!VALID_PHONE.test(phone)) return fail(res, 400, 'Valid 10-digit Indian mobile number is required');

    const record = {
      id: newId('FA'),
      timestamp: new Date().toISOString(),
      studentName,
      parentName: clean(body.parentName, 80),
      phone,
      grade: clean(body.grade, 50),
      board: clean(body.board, 60),
      batchId: clean(body.batchId, 60) || null,
      reservationId: null,
      timing: clean(body.timing, 50) || null,
      subjects: clean(body.subjects, 150),
      notes: clean(body.notes, 300),
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
      deliveryStatus,
      message: 'Admission inquiry registered successfully at Focus Academy campus desk.',
    });
  } catch {
    return unavailable(res);
  }
}
