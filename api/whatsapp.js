import { getServices } from './_lib/firebaseAdmin.js';
import { authenticateAdmin } from './_lib/adminAuth.js';
import { prepare, fail, unavailable, crashed, clean, cleanPhone, clientIp, withinRate } from './_lib/http.js';

export default async function handler(req, res) {
  prepare(res, ['GET', 'POST']);
  const services = await getServices();
  if (!services) return unavailable(res);
  const { db } = services;

  // 1. Meta Webhook Verification Challenge (GET)
  const searchParams = req.url ? new URL(req.url, 'http://localhost').searchParams : new URLSearchParams();
  const hubMode = searchParams.get('hub.mode') || req.query?.['hub.mode'];
  const hubToken = searchParams.get('hub.verify_token') || req.query?.['hub.verify_token'];
  const hubChallenge = searchParams.get('hub.challenge') || req.query?.['hub.challenge'];

  if (req.method === 'GET' && hubMode === 'subscribe') {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'focus_academy_webhook_verify_2026';
    if (hubToken === expectedToken) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(hubChallenge);
    }
    return fail(res, 403, 'WhatsApp verification token mismatch');
  }

  // 2. Meta WhatsApp Cloud API Delivery Status Webhook (POST)
  if (req.method === 'POST' && (req.body?.object === 'whatsapp_business_account' || req.body?.entry)) {
    try {
      const entries = req.body?.entry || [];
      let updatedCount = 0;
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const statuses = change.value?.statuses || [];
          for (const s of statuses) {
            const messageId = s.id;
            const deliveryStatus = s.status; // 'sent' | 'delivered' | 'read' | 'failed'
            const timestamp = s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : new Date().toISOString();

            if (messageId) {
              const querySnap = await db.collection('reminders').where('providerMessageId', '==', messageId).get();
              for (const docSnap of querySnap.docs) {
                await docSnap.ref.update({
                  deliveryStatus,
                  deliveryStatusUpdatedAt: timestamp,
                  status: deliveryStatus
                });
                updatedCount++;
              }
            }
          }
        }
      }
      return res.status(200).json({ success: true, processed: true, updatedCount });
    } catch (whErr) {
      console.warn('WhatsApp webhook status update warning:', whErr);
      return res.status(200).json({ success: true, warning: whErr.message });
    }
  }

  try {
    const access = await authenticateAdmin(req, services, { permission: 'canTriggerReminders' });
    if (!access.ok) return fail(res, access.status, access.error);

    const cloudApiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const automated = Boolean(cloudApiToken && phoneNumberId);

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        automatedDeliveryAvailable: automated,
        deliveryChannel: automated ? 'meta_cloud_api' : 'manual_click_to_chat_fallback',
      });
    }
    if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

    if (!(await withinRate(db, 'wa', access.uid, 30, 60 * 1000)) || !(await withinRate(db, 'wa-ip', clientIp(req), 60, 60 * 1000))) {
      return fail(res, 429, 'Rate limit exceeded. Please wait before sending more reminders.');
    }

    const obligationId = clean(req.body?.obligationId, 80);
    const reminderType = ['upcoming', 'due', 'overdue'].includes(req.body?.reminderType) ? req.body.reminderType : 'upcoming';
    if (!obligationId) return fail(res, 400, 'obligationId is required.');

    const obligationSnap = await db.collection('fee_obligations').doc(obligationId).get();
    if (!obligationSnap.exists) return fail(res, 404, 'Fee obligation not found.');
    const obligation = obligationSnap.data();

    const balance = Math.max(0, Number(obligation.amountDue || 0) - Number(obligation.amountPaid || 0) - Number(obligation.waivedAmount || 0));
    if (balance <= 0 || ['paid', 'waived'].includes(obligation.status)) {
      return fail(res, 409, 'This obligation has no outstanding balance.');
    }

    const studentSnap = await db.collection('students').doc(String(obligation.studentId)).get();
    if (!studentSnap.exists) return fail(res, 404, 'Student record not found.');
    const student = studentSnap.data();
    if (student.communicationConsent === false || student.remindersDisabled === true) {
      return fail(res, 403, 'This guardian has opted out of fee reminders.');
    }

    const recipient = cleanPhone(student.guardianPhone || student.phone);
    if (recipient.length !== 10) return fail(res, 422, 'The guardian mobile number on file is not valid.');

    const dayKey = new Date().toISOString().slice(0, 10);
    const reminderRef = db.collection('reminders').doc(`${obligationId}__${reminderType}__${dayKey}`);
    const existing = await reminderRef.get();
    if (existing.exists) {
      return fail(res, 409, 'A reminder for this obligation was already sent today.');
    }

    const studentName = clean(obligation.studentName || student.studentName, 80);
    const dueDate = clean(obligation.dueDate, 30) || 'the scheduled date';
    const message = `Hello, this is Focus Academy. A fee payment of ₹${balance} for ${studentName} is due on ${dueDate}. If you have already paid, please contact the academy so we can verify the payment. Thank you.`;
    const clickToChatUrl = `https://wa.me/91${recipient}?text=${encodeURIComponent(message)}`;

    const base = {
      obligationId,
      studentId: obligation.studentId,
      studentName,
      reminderType,
      amount: balance,
      recipient: `+91${recipient}`,
      requestedBy: access.email,
      createdAt: new Date().toISOString(),
    };

    if (!automated) {
      await reminderRef.set({ ...base, channel: 'manual_click_to_chat', status: 'queued' });
      return res.status(200).json({ success: true, mode: 'manual_fallback', automated: false, message, clickToChatUrl });
    }

    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cloudApiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: `91${recipient}`, type: 'text', text: { preview_url: false, body: message } }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      await reminderRef.set({ ...base, channel: 'meta_cloud_api', status: 'failed' });
      return res.status(502).json({ success: false, error: 'WhatsApp could not accept this message right now.', fallbackClickToChatUrl: clickToChatUrl });
    }

    await reminderRef.set({ ...base, channel: 'meta_cloud_api', status: 'accepted', providerMessageId: data.messages?.[0]?.id || null });
    return res.status(200).json({ success: true, mode: 'automated_delivery', automated: true, status: 'accepted', messageId: data.messages?.[0]?.id });
  } catch (err) {
    return crashed(res, 'whatsapp', err);
  }
}
