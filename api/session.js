import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'focus-academy-admission-salt-2026';
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

const ipHits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_SESSIONS_PER_WINDOW = 30;

function checkRateLimit(ip, limit = MAX_SESSIONS_PER_WINDOW) {
  const now = Date.now();
  const history = ipHits.get(ip) || [];
  const valid = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= limit) {
    ipHits.set(ip, valid);
    return false;
  }
  valid.push(now);
  ipHits.set(ip, valid);
  return true;
}

function safeCompare(a, b) {
  try {
    const bufA = Buffer.from(String(a || ''), 'utf8');
    const bufB = Buffer.from(String(b || ''), 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function signStep(step, phone, name, timestamp, expiresAt) {
  const payload = `${step}:${phone}:${name}:${timestamp}:${expiresAt}`;
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex').slice(0, 16);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const clientIp = req.headers['x-forwarded-for'] 
    ? String(req.headers['x-forwarded-for']).split(',')[0].trim() 
    : (req.socket?.remoteAddress || '127.0.0.1');

  if (req.method === 'POST') {
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
    }

    const { step = 1, phone = '', studentName = '' } = req.body || {};
    const stepNum = Number(step) || 1;
    if (stepNum < 1 || stepNum > 6) {
      return res.status(400).json({ success: false, error: 'Invalid step range' });
    }

    const sanitizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const sanitizedName = String(studentName).replace(/[<>'"`;]/g, '').trim().slice(0, 80);
    const timestamp = Date.now();
    const expiresAt = timestamp + TOKEN_TTL_MS;
    const signature = signStep(stepNum, sanitizedPhone, sanitizedName, timestamp, expiresAt);
    const token = `v1.${stepNum}.${timestamp}.${expiresAt}.${signature}`;

    return res.status(200).json({
      success: true,
      token,
      step: stepNum,
      expiresAt,
      verified: true
    });
  }

  if (req.method === 'GET') {
    const token = String(req.query.token || '');
    const step = Number(req.query.step || 1);
    const phone = String(req.query.phone || '').replace(/\D/g, '').slice(-10);
    const studentName = String(req.query.studentName || '').replace(/[<>'"`;]/g, '').trim().slice(0, 80);

    if (!token || !token.startsWith('v1.')) {
      return res.status(400).json({ valid: false, reason: 'Missing or malformed step token' });
    }

    const parts = token.split('.');
    if (parts.length === 5) {
      const tokenStep = Number(parts[1]);
      const tokenTime = Number(parts[2]);
      const tokenExpiry = Number(parts[3]);
      const tokenSig = parts[4];

      if (Date.now() > tokenExpiry) {
        return res.status(401).json({ valid: false, reason: 'Token expired' });
      }

      const expectedSig = signStep(tokenStep, phone, studentName, tokenTime, tokenExpiry);
      const sigMatches = safeCompare(tokenSig, expectedSig);
      const valid = sigMatches && (tokenStep >= step);

      return res.status(valid ? 200 : 401).json({
        valid,
        step: tokenStep,
        expiresAt: tokenExpiry,
        reason: valid ? 'Verified' : 'Token signature mismatch'
      });
    }

    if (parts.length === 4) {
      const tokenStep = Number(parts[1]);
      const tokenTime = Number(parts[2]);
      const tokenSig = parts[3];

      if (Date.now() - tokenTime > TOKEN_TTL_MS) {
        return res.status(401).json({ valid: false, reason: 'Token expired' });
      }

      const legacyExpected = crypto.createHmac('sha256', SESSION_SECRET).update(`${tokenStep}:${phone}:${studentName}`).digest('hex').slice(0, 16);
      const sigMatches = safeCompare(tokenSig, legacyExpected);
      const valid = sigMatches && (tokenStep >= step);

      return res.status(valid ? 200 : 401).json({
        valid,
        step: tokenStep,
        reason: valid ? 'Verified' : 'Token signature mismatch'
      });
    }

    return res.status(400).json({ valid: false, reason: 'Invalid token structure' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
