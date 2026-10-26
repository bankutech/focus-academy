import { getServices } from './_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, crashed, clean, cleanPhone, newId, clientIp, withinRate } from './_lib/http.js';
import { hasSecret, mintToken } from './_lib/stepToken.js';

const MAX_STEP = 4;
const VALID_PHONE = /^[6-9]\d{9}$/;

export default async function handler(req, res) {
  prepare(res, ['POST']);
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

  const services = await getServices();
  if (!services || !hasSecret()) return unavailable(res);
  const { db } = services;

  try {
    if (!(await withinRate(db, 'session', clientIp(req), 40, 60 * 1000))) {
      return fail(res, 429, 'Too many requests. Please wait a moment and try again.');
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const step = Number(body.step);
    if (!Number.isInteger(step) || step < 2 || step > MAX_STEP) {
      return fail(res, 400, 'Invalid step.');
    }

    const studentName = clean(body.studentName, 80);
    const phone = cleanPhone(body.phone);
    const grade = clean(body.grade, 50);
    const board = clean(body.board, 60);
    if (studentName.length < 2 || !VALID_PHONE.test(phone) || !grade || !board) {
      return fail(res, 400, 'Student name, mobile number, class and board are required.');
    }

    const applicationId = clean(body.applicationId, 40) || newId('APP');
    const ref = db.collection('applications').doc(applicationId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const stored = snap.exists ? snap.data() : null;
      const completed = stored ? stored.completedStep : 1;
      if (stored && stored.phone !== phone) return { error: 'This application belongs to a different mobile number.', status: 403 };
      if (step > completed + 1) return { error: 'Please complete the earlier steps first.', status: 409 };
      const nextCompleted = Math.max(completed, step);
      tx.set(ref, {
        studentName,
        phone,
        grade,
        board,
        completedStep: nextCompleted,
        createdAt: stored ? stored.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { completed: nextCompleted };
    });

    if (result.error) return fail(res, result.status, result.error);

    const { token, expiresAt } = mintToken(applicationId, result.completed);
    return res.status(200).json({
      success: true,
      applicationId,
      step: result.completed,
      token,
      expiresAt,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    return crashed(res, 'session', err);
  }
}
