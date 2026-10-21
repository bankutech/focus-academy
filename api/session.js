import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'focus-academy-admission-salt-2026';

function signStep(step, phone, name) {
  const payload = `${step}:${phone}:${name}`;
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

  if (req.method === 'POST') {
    const { step = 1, phone = '', studentName = '' } = req.body || {};
    const sanitizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    const sanitizedName = String(studentName).trim();
    const signature = signStep(step, sanitizedPhone, sanitizedName);
    const token = `v1.${step}.${Date.now()}.${signature}`;

    return res.status(200).json({
      success: true,
      token,
      step: Number(step),
      verified: true
    });
  }

  if (req.method === 'GET') {
    const token = String(req.query.token || '');
    const step = Number(req.query.step || 1);
    const phone = String(req.query.phone || '').replace(/\D/g, '').slice(-10);
    const studentName = String(req.query.studentName || '').trim();

    if (!token || !token.startsWith('v1.')) {
      return res.status(400).json({ valid: false, reason: 'Missing or malformed step token' });
    }

    const parts = token.split('.');
    if (parts.length !== 4) {
      return res.status(400).json({ valid: false, reason: 'Invalid token structure' });
    }

    const tokenStep = Number(parts[1]);
    const tokenSig = parts[3];
    const expectedSig = signStep(tokenStep, phone, studentName);

    const valid = (tokenSig === expectedSig) && (tokenStep >= step);

    return res.status(200).json({
      valid,
      step: tokenStep,
      reason: valid ? 'Verified' : 'Token signature mismatch'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
