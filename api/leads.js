const ipHits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_LEADS_PER_WINDOW = 10;

function checkRateLimit(ip, limit = MAX_LEADS_PER_WINDOW) {
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] 
    ? String(req.headers['x-forwarded-for']).split(',')[0].trim() 
    : (req.socket?.remoteAddress || '127.0.0.1');

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ 
      success: false, 
      error: 'Too many inquiries from this IP address. Please wait a minute before submitting again.' 
    });
  }

  const body = req.body || {};
  if (typeof body !== 'object' || body === null) {
    return res.status(400).json({ success: false, error: 'Malformed request body' });
  }

  const rawJson = JSON.stringify(body);
  if (rawJson.length > 8192) {
    return res.status(413).json({ success: false, error: 'Payload size exceeds limit' });
  }

  const sanitize = (val, max = 150) => String(val || '').replace(/[<>'"`;]/g, '').trim().slice(0, max);

  const studentName = sanitize(body.studentName, 80);
  const parentName = sanitize(body.parentName, 80);
  const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
  const grade = sanitize(body.grade, 50);
  const board = sanitize(body.board, 50);
  const subjects = sanitize(body.subjects, 150);
  const notes = sanitize(body.notes, 300);

  if (!studentName || studentName.length < 2) {
    return res.status(400).json({ success: false, error: 'Valid student name is required' });
  }

  if (phone.length !== 10) {
    return res.status(400).json({ success: false, error: 'Valid 10-digit Indian mobile number is required' });
  }

  const leadId = `FA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const record = {
    id: leadId,
    timestamp,
    studentName,
    parentName,
    phone,
    grade,
    board,
    subjects,
    notes,
    campus: 'Thoramangalam, Perambalur',
  };

  let deliveryStatus = 'received_at_campus';
  let webhookDelivery = null;

  const webhookUrl = process.env.LEAD_WEBHOOK_URL || process.env.VITE_LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        deliveryStatus = 'webhook_delivered';
        webhookDelivery = { ok: true, status: response.status };
      } else {
        deliveryStatus = 'webhook_failed';
        webhookDelivery = { ok: false, status: response.status };
      }
    } catch (err) {
      deliveryStatus = 'webhook_failed';
      webhookDelivery = { ok: false, error: err ? err.message : 'Webhook network failure' };
    }
  }

  return res.status(200).json({
    success: true,
    data: record,
    deliveryStatus,
    webhookDelivery,
    message: 'Admission inquiry registered successfully at Focus Academy campus desk.',
  });
}
