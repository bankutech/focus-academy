export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const studentName = String(body.studentName || '').trim();
  const parentName = String(body.parentName || '').trim();
  const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
  const grade = String(body.grade || '').trim();
  const board = String(body.board || '').trim();
  const subjects = String(body.subjects || '').trim();
  const notes = String(body.notes || '').trim();

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

  const webhookUrl = process.env.LEAD_WEBHOOK_URL || process.env.VITE_LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch {
    }
  }

  return res.status(200).json({
    success: true,
    data: record,
    message: 'Admission inquiry registered successfully at Focus Academy campus desk.',
  });
}
