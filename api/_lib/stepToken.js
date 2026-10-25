import crypto from 'crypto';

const TTL_MS = 2 * 60 * 60 * 1000;

const secret = () => {
  const value = process.env.SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
};

export const hasSecret = () => Boolean(secret());

const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('hex');

export const mintToken = (applicationId, step) => {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `v2.${applicationId}.${step}.${expiresAt}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
};

export const readToken = (token) => {
  if (!secret() || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 5 || parts[0] !== 'v2') return null;
  const [version, applicationId, step, expiresAt, signature] = parts;
  const expected = sign(`${version}.${applicationId}.${step}.${expiresAt}`);
  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Date.now() > Number(expiresAt)) return null;
  return { applicationId, step: Number(step), expiresAt: Number(expiresAt) };
};
