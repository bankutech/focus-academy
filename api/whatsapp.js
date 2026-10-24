const ipHits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip, limit = MAX_REQUESTS_PER_WINDOW) {
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const clientIp = req.headers['x-forwarded-for']
    ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
    : (req.socket?.remoteAddress || '127.0.0.1');

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait before attempting further reminder dispatches.'
    });
  }

  const cloudApiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const isCloudApiConfigured = Boolean(cloudApiToken && phoneNumberId);

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'Focus Academy WhatsApp Reminder Gateway',
      automatedDeliveryAvailable: isCloudApiConfigured,
      deliveryChannel: isCloudApiConfigured ? 'meta_cloud_api' : 'manual_click_to_chat_fallback',
      status: 'operational',
      environment: process.env.NODE_ENV || 'production'
    });
  }

  if (req.method === 'POST') {
    const {
      studentName = '',
      phone = '',
      guardianPhone = '',
      amount = 0,
      dueDate = '',
      reminderType = 'upcoming',
      obligationId = ''
    } = req.body || {};

    const rawPhone = guardianPhone || phone;
    const cleanPhone = String(rawPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient mobile number. Exactly 10 digits are required.'
      });
    }

    const sanitizedName = String(studentName || '').replace(/[<>'"`;]/g, '').trim().slice(0, 80);
    if (!sanitizedName) {
      return res.status(400).json({
        success: false,
        error: 'Student name is mandatory.'
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number.'
      });
    }

    const message = `Hello, this is Focus Academy. A fee payment of ₹${numAmount} for ${sanitizedName} is due on ${dueDate || 'the scheduled date'}. If you have already paid, please contact the academy so we can verify the payment. Thank you.`;
    const clickToChatUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;

    if (!isCloudApiConfigured) {
      return res.status(200).json({
        success: true,
        mode: 'manual_fallback',
        automated: false,
        notice: 'Meta WhatsApp Cloud API credentials not configured in server environment. Manual click-to-chat fallback link generated.',
        message,
        clickToChatUrl,
        payload: {
          recipient: `+91${cleanPhone}`,
          studentName: sanitizedName,
          amount: numAmount,
          dueDate,
          reminderType,
          obligationId
        }
      });
    }

    try {
      const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${cleanPhone}`,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      });

      const data = await metaResponse.json();

      if (!metaResponse.ok) {
        return res.status(502).json({
          success: false,
          mode: 'meta_cloud_api_error',
          error: data.error?.message || 'Meta WhatsApp Cloud API rejected request.',
          fallbackClickToChatUrl: clickToChatUrl
        });
      }

      return res.status(200).json({
        success: true,
        mode: 'automated_delivery',
        automated: true,
        messageId: data.messages?.[0]?.id,
        recipient: `+91${cleanPhone}`,
        providerResponse: data,
        clickToChatUrl
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        mode: 'server_dispatch_error',
        error: err.message || 'Failed to dispatch via Meta WhatsApp API.',
        fallbackClickToChatUrl: clickToChatUrl
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed. Use GET or POST.'
  });
}
