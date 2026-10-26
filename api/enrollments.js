import { getServices } from './_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, crashed, clean, clientIp, withinRate } from './_lib/http.js';
import { authenticateAdmin } from './_lib/adminAuth.js';

export default async function handler(req, res) {
  prepare(res, ['GET']);
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed');

  const services = await getServices();
  if (!services) return unavailable(res);
  const { db, auth } = services;

  try {
    if (!(await withinRate(db, 'enrollments_api', clientIp(req), 60, 60 * 1000))) {
      return fail(res, 429, 'Rate limit exceeded. Please wait a moment.');
    }

    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    let decoded = null;
    if (token) {
      try {
        decoded = await auth.verifyIdToken(token);
      } catch {
        // Token invalid or expired
      }
    }

    // Check if requester is an admin
    const adminCheck = await authenticateAdmin(req, services, 'fee_manager');
    const isAdmin = adminCheck.ok;

    const studentUid = clean(req.query.studentUid, 128);

    let queryRef = db.collection('enrollments');

    if (isAdmin) {
      // Admin can query all or filter by batchId/status/studentUid
      if (req.query.batchId) {
        queryRef = queryRef.where('batchId', '==', clean(req.query.batchId, 60));
      }
      if (req.query.status) {
        queryRef = queryRef.where('status', '==', clean(req.query.status, 40));
      }
      if (studentUid) {
        queryRef = queryRef.where('studentUid', '==', studentUid);
      }
    } else if (decoded && decoded.uid) {
      // Authenticated student can only view their own enrollments
      queryRef = queryRef.where('studentUid', '==', decoded.uid);
    } else {
      return fail(res, 401, 'Authentication required to view enrollment records.');
    }

    const snap = await queryRef.get();
    const records = [];
    snap.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });

    records.sort((a, b) => new Date(b.enrolledAt || 0) - new Date(a.enrolledAt || 0));

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    return crashed(res, 'enrollments', err);
  }
}
