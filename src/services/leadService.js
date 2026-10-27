import { CAMPUS_CONFIG } from '../config/campusConfig';
import { validateLeadInquiry } from '../types/schemas';

const STORAGE_QUEUE_KEY = 'focus_academy_pending_leads_v1';
const STORAGE_LOGS_KEY = 'focus_academy_submitted_leads_v1';

const QUEUE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const QUEUE_MAX_ENTRIES = 5;
const SUBMIT_TIMEOUT_MS = 8000;

const RECEIPT_FIELDS = ['id', 'studentName', 'parentName', 'phone', 'grade', 'board', 'batchId', 'selectedBatchName', 'timing', 'source', 'submittedAt', 'serverConfirmed'];

const toReceipt = (lead) =>
  RECEIPT_FIELDS.reduce((receipt, field) => {
    if (lead[field] !== undefined) receipt[field] = lead[field];
    return receipt;
  }, {});

const newIdempotencyKey = () =>
  `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const LeadService = {
  getWebhookUrl() {
    return '/api/leads';
  },

  async submitLead(rawLeadData) {
    const validation = validateLeadInquiry(rawLeadData);
    if (!validation.isValid) {
      return { success: false, status: 'invalid', errors: validation.errors };
    }

    const stepToken = rawLeadData.stepToken;
    const payload = validation.sanitized;
    delete payload.stepToken;

    const recentDuplicate = this.getAllSubmissions().find(
      (sub) =>
        sub.serverConfirmed === true &&
        sub.phone === payload.phone &&
        sub.studentName === payload.studentName &&
        Date.now() - new Date(sub.submittedAt).getTime() < 30000
    );
    if (recentDuplicate) {
      return {
        success: true,
        status: 'duplicate',
        data: recentDuplicate,
        duplicateSuppressed: true,
        message: 'Your inquiry was recently received. Redirecting to confirmation.',
        whatsappUrl: this.generateWhatsAppUrl(recentDuplicate),
      };
    }

    payload.id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    payload.submittedAt = new Date().toISOString();
    payload.idempotencyKey = payload.idempotencyKey || newIdempotencyKey();

    const isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    if (!isOnline) {
      return this._queueForRetry(payload, 'Your device is offline, so the campus has not received this yet.');
    }

    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) {
      return this._queueForRetry(payload, 'No admissions endpoint is configured.');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.idempotencyKey },
        body: JSON.stringify({ ...payload, stepToken }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.success === false) {
        return this._queueForRetry(payload, body.error || `The campus server responded with status ${response.status}.`);
      }

      const stored = { ...payload, ...(body.data || {}), id: body.data?.id || payload.id, serverConfirmed: true };
      this._recordSubmission(stored);
      this._dispatchLeadEvent(stored);
      return {
        success: true,
        status: 'delivered',
        data: stored,
        offlineQueued: false,
        message: 'Inquiry received. Campus counselor will contact you within 2 hours.',
        whatsappUrl: this.generateWhatsAppUrl(stored),
      };
    } catch (err) {
      const reason = err?.name === 'AbortError' ? 'The campus server took too long to respond.' : 'The campus server could not be reached.';
      return this._queueForRetry(payload, reason);
    }
  },

  _queueForRetry(lead, reason) {
    this._enqueueOffline(lead);
    this._recordSubmission(lead);
    return {
      success: false,
      status: 'queued_locally',
      data: lead,
      offlineQueued: true,
      retryable: true,
      message: `${reason} Your details are saved on this device and will be sent automatically when the connection returns.`,
      whatsappUrl: this.generateWhatsAppUrl(lead),
    };
  },

  async retryLastAttempt(lead) {
    if (!lead) return { success: false, status: 'invalid' };
    return this.submitLead({ ...lead, idempotencyKey: lead.idempotencyKey });
  },

  generateWhatsAppUrl(lead) {
    const phone = CAMPUS_CONFIG.contact.whatsappNumber;
    const text = encodeURIComponent(
      `Hello Focus Academy, Thoramangalam! 👋\n\nI want to enroll in Evening Batches.\n\n• Student: ${lead.studentName}\n• Parent: ${lead.parentName || 'Parent'}\n• Class: ${lead.grade} (${lead.board})\n• Contact: +91 ${lead.phone}\n• Selected Batch/Subjects: ${lead.subjects || lead.selectedBatchName || 'Core Subjects'}\n\nPlease share admission details.`
    );
    return `https://wa.me/${phone}?text=${text}`;
  },

  _enqueueOffline(lead) {
    try {
      const queue = this.getQueuedLeads();
      const key = `${lead.phone}::${lead.studentName}`;
      const withoutExisting = queue.filter((item) => `${item.phone}::${item.studentName}` !== key);
      withoutExisting.unshift({ ...lead, queuedAt: new Date().toISOString() });
      const cutoff = Date.now() - QUEUE_MAX_AGE_MS;
      const trimmed = withoutExisting
        .filter((item) => new Date(item.queuedAt || item.submittedAt).getTime() > cutoff)
        .slice(0, QUEUE_MAX_ENTRIES);
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(trimmed));
    } catch {
    }
  },

  _recordSubmission(lead) {
    try {
      const receipt = toReceipt(lead);
      const logs = this.getAllSubmissions().filter((item) => {
        const t = item.submittedAt ? new Date(item.submittedAt).getTime() : 0;
        return t > Date.now() - 60 * 60 * 1000;
      });
      const existingIdx = logs.findIndex((item) => (item.id && item.id === receipt.id) || (item.phone === receipt.phone && item.studentName === receipt.studentName));
      if (existingIdx >= 0) {
        logs[existingIdx] = { ...logs[existingIdx], ...receipt };
      } else {
        logs.unshift(receipt);
      }
      if (logs.length > 20) logs.pop();
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
    } catch {
    }
  },

  _dispatchLeadEvent(lead) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        const event = new CustomEvent('focus-academy:lead-captured', { detail: toReceipt(lead) });
        window.dispatchEvent(event);
      } catch {
      }
    }
  },

  getQueuedLeads() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_QUEUE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async syncOfflineQueue() {
    try {
      const queue = this.getQueuedLeads();
      if (!queue.length) return 0;

      const webhookUrl = this.getWebhookUrl();
      const remaining = [];

      for (const lead of queue) {
        if (!webhookUrl) {
          remaining.push(lead);
          continue;
        }
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Idempotency-Key': lead.idempotencyKey || lead.id },
            body: JSON.stringify(lead),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const body = await response.json().catch(() => ({}));
          if (response.ok && body.success !== false) {
            this._recordSubmission({ ...lead, ...(body.data || {}) });
          } else {
            remaining.push(lead);
          }
        } catch {
          remaining.push(lead);
        }
      }

      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(remaining));
      return queue.length - remaining.length;
    } catch {
      return 0;
    }
  },

  getQueuedLeadsCount() {
    return this.getQueuedLeads().length;
  },

  getAllSubmissions() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_LOGS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  clearSubmissions() {
    try {
      localStorage.removeItem(STORAGE_LOGS_KEY);
      localStorage.removeItem(STORAGE_QUEUE_KEY);
    } catch {
    }
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    LeadService.syncOfflineQueue();
  });
}
