import crypto from 'crypto';

export const clientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
};

export const prepare = (res, methods) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', methods.join(', '));
};

export const fail = (res, status, error, extra = {}) => res.status(status).json({ success: false, error, ...extra });

export const unavailable = (res) => fail(res, 503, 'The admissions service is temporarily unavailable. Please try again in a minute.');

export const clean = (value, max = 150) => String(value ?? '').replace(/[<>'"`;]/g, '').trim().slice(0, max);

export const cleanPhone = (value) => String(value ?? '').replace(/\D/g, '').slice(-10);

export const newId = (prefix) => `${prefix}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

export const withinRate = async (db, bucket, key, limit, windowMs) => {
  const slot = Math.floor(Date.now() / windowMs);
  const hashed = crypto.createHash('sha256').update(`${bucket}:${key}`).digest('hex').slice(0, 24);
  const ref = db.collection('rate_limits').doc(`${bucket}-${hashed}-${slot}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? snap.data().count : 0;
    if (count >= limit) return false;
    tx.set(ref, { count: count + 1, expiresAt: new Date((slot + 2) * windowMs) });
    return true;
  });
};
