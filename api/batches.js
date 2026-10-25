import { getServices } from './_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, clean, cleanPhone, clientIp, newId, withinRate } from './_lib/http.js';
import { readToken } from './_lib/stepToken.js';
import { isBatchCompatible } from '../src/types/schemas.js';

const HOLD_MS = 15 * 60 * 1000;
const ACTIVE = ['held', 'confirmed'];

const describe = (remaining) => {
  if (remaining <= 0) return 'Batch Full • Waitlist Open';
  if (remaining <= 2) return `Limited Seats • ${remaining} Left`;
  return `Admissions Open (${remaining} Seats Left)`;
};

const isLive = (reservation, now) => reservation.status === 'confirmed' || Date.parse(reservation.expiresAt) > now;

export default async function handler(req, res) {
  prepare(res, ['GET', 'POST']);
  const services = getServices();
  if (!services) return unavailable(res);
  const { db } = services;

  try {
    if (req.method === 'GET') {
      const [batchSnap, holdSnap] = await Promise.all([
        db.collection('batches').get(),
        db.collection('reservations').where('status', 'in', ACTIVE).get(),
      ]);
      const now = Date.now();
      const held = new Map();
      holdSnap.docs.forEach((d) => {
        const r = d.data();
        if (isLive(r, now)) held.set(r.batchId, (held.get(r.batchId) || 0) + 1);
      });
      const batches = batchSnap.docs
        .map((d) => d.data())
        .filter((b) => !b.isArchived)
        .map((b) => {
          const reserved = held.get(b.id) || 0;
          const capacity = Number(b.capacity) || 12;
          const seatsRemaining = Math.max(0, capacity - (Number(b.enrolledCount) || 0) - reserved);
          return { ...b, capacity, seatsRemaining, status: describe(seatsRemaining) };
        });
      return res.status(200).json({ success: true, timestamp: new Date().toISOString(), batches });
    }

    if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

    if (!(await withinRate(db, 'reserve', clientIp(req), 15, 60 * 1000))) {
      return fail(res, 429, 'Too many reservation attempts. Please wait a moment.');
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const batchId = clean(body.batchId, 60).replace(/[^a-zA-Z0-9_-]/g, '');
    const proof = readToken(String(body.stepToken || ''));
    if (!batchId) return fail(res, 400, 'batchId is required');
    if (!proof || proof.step < 4) return fail(res, 401, 'Your admission session could not be verified. Please go back and continue from the previous step.');

    const phone = cleanPhone(body.phone);
    const appRef = db.collection('applications').doc(proof.applicationId);
    const batchRef = db.collection('batches').doc(batchId);
    const reservationRef = db.collection('reservations').doc(`${proof.applicationId}__${batchId}`);

    const outcome = await db.runTransaction(async (tx) => {
      const [appSnap, batchSnap, holdSnap, mineSnap] = await Promise.all([
        tx.get(appRef),
        tx.get(batchRef),
        tx.get(db.collection('reservations').where('batchId', '==', batchId)),
        tx.get(db.collection('reservations').where('applicationId', '==', proof.applicationId)),
      ]);

      if (!appSnap.exists || appSnap.data().completedStep < 4 || appSnap.data().phone !== phone) {
        return { status: 403, error: 'Your admission session does not match these details.' };
      }
      if (!batchSnap.exists || batchSnap.data().isArchived) {
        return { status: 404, error: 'This batch is not open for online booking right now. Please call the campus desk.' };
      }
      const batch = batchSnap.data();
      const application = appSnap.data();
      if (!isBatchCompatible(batch, application.grade, application.board)) {
        return { status: 422, error: `Academic mismatch: ${batch.name} is not available for ${application.grade} (${application.board}).` };
      }

      const now = Date.now();
      const holds = holdSnap.docs.filter((d) => ACTIVE.includes(d.data().status));
      const existing = holds.find((d) => d.id === reservationRef.id);
      if (existing && isLive(existing.data(), now)) {
        const r = existing.data();
        if (r.status === 'held') tx.update(reservationRef, { expiresAt: new Date(now + HOLD_MS).toISOString() });
        return { reservationId: r.reservationId, batch, reservedNow: holds.filter((d) => isLive(d.data(), now)).length };
      }

      const live = holds.filter((d) => isLive(d.data(), now)).length;
      const capacity = Number(batch.capacity) || 12;
      if (capacity - (Number(batch.enrolledCount) || 0) - live <= 0) {
        return { status: 409, error: 'Batch capacity reached. All 12 seats in this classroom have been allocated.' };
      }

      mineSnap.docs.filter((d) => d.id !== reservationRef.id && ACTIVE.includes(d.data().status)).forEach((d) => tx.update(d.ref, { status: 'released' }));

      const reservationId = newId('RES');
      tx.set(reservationRef, {
        reservationId,
        applicationId: proof.applicationId,
        batchId,
        studentName: application.studentName,
        phone,
        status: 'held',
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + HOLD_MS).toISOString(),
      });
      return { reservationId, batch, reservedNow: live + 1 };
    });

    if (outcome.error) return fail(res, outcome.status, outcome.error);

    const capacity = Number(outcome.batch.capacity) || 12;
    const seatsRemaining = Math.max(0, capacity - (Number(outcome.batch.enrolledCount) || 0) - outcome.reservedNow);
    return res.status(200).json({
      success: true,
      batchId,
      reserved: true,
      reservationId: outcome.reservationId,
      seatsRemaining,
      holdMinutes: HOLD_MS / 60000,
      message: 'Seat held for 15 minutes at the Thiripura Complex campus.',
    });
  } catch {
    return unavailable(res);
  }
}
