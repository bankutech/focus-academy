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

const BATCHES = [
  { id: 'batch-10-state-board', grade: 'Class 10', board: 'TN State Board (Samacheer)' },
  { id: 'batch-10-cbse', grade: 'Class 10', board: 'CBSE Board' },
  { id: 'batch-10-icse', grade: 'Class 10', board: 'ICSE Board' },
  { id: 'batch-12-science-board', grade: 'Class 12', board: 'TN State Board, CBSE & ISC' },
  { id: 'batch-middle-foundation', grade: 'Classes 6 to 8', board: 'Samacheer, CBSE & ICSE' },
  { id: 'batch-9-preboard', grade: 'Class 9', board: 'TN State Board, CBSE & ICSE' },
  { id: 'batch-11-science', grade: 'Class 11', board: 'TN State Board, CBSE & ISC' },
  { id: 'batch-remedial-maths', grade: 'Classes 9 & 10', board: 'Samacheer, CBSE & ICSE' }
];

function isCompatible(batch, grade, board) {
  if (!batch || !grade) return false;
  const g = String(grade).toLowerCase();
  const bGrade = String(batch.grade || '').toLowerCase();
  let gradeMatch = false;
  if (g.includes('6') || g.includes('7') || g.includes('8') || g.includes('middle')) {
    gradeMatch = bGrade.includes('6') || bGrade.includes('7') || bGrade.includes('8') || bGrade.includes('middle');
  } else if (g.includes('9')) {
    gradeMatch = bGrade.includes('9');
  } else if (g.includes('10')) {
    gradeMatch = bGrade.includes('10');
  } else if (g.includes('11')) {
    gradeMatch = bGrade.includes('11');
  } else if (g.includes('12')) {
    gradeMatch = bGrade.includes('12');
  }
  if (!gradeMatch) return false;
  if (board && board !== 'all') {
    const b = String(board).toLowerCase();
    const bBoard = String(batch.board || '').toLowerCase();
    if (b.includes('state') || b.includes('samacheer')) {
      if (!bBoard.includes('state') && !bBoard.includes('samacheer')) return false;
    } else if (b.includes('cbse')) {
      if (!bBoard.includes('cbse')) return false;
    } else if (b.includes('icse') || b.includes('isc')) {
      if (!bBoard.includes('icse') && !bBoard.includes('isc')) return false;
    }
  }
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
  const batchId = sanitize(body.batchId, 50);
  const reservationId = sanitize(body.reservationId, 50);
  const timing = sanitize(body.timing, 50);
  const subjects = sanitize(body.subjects, 150);
  const notes = sanitize(body.notes, 300);

  if (!studentName || studentName.length < 2) {
    return res.status(400).json({ success: false, error: 'Valid student name is required' });
  }

  if (phone.length !== 10) {
    return res.status(400).json({ success: false, error: 'Valid 10-digit Indian mobile number is required' });
  }

  if (batchId) {
    const matched = BATCHES.find((b) => b.id === batchId);
    if (matched && grade && !isCompatible(matched, grade, board)) {
      return res.status(422).json({
        success: false,
        error: `Academic mismatch: Batch ${matched.id} is incompatible with student grade ${grade} (${board || 'All'}).`
      });
    }
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
    batchId: batchId || null,
    reservationId: reservationId || null,
    timing: timing || null,
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
