import { CAMPUS_CONFIG } from '../config/campusConfig';
import { validateLeadInquiry } from '../types/schemas';

const STORAGE_QUEUE_KEY = 'focus_academy_pending_leads_v1';
const STORAGE_LOGS_KEY = 'focus_academy_submitted_leads_v1';

export const LeadService = {
  getWebhookUrl() {
    return '/api/leads';
  },

  async submitLead(rawLeadData) {
    const validation = validateLeadInquiry(rawLeadData);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    const stepToken = rawLeadData.stepToken;
    const payload = validation.sanitized;
    delete payload.stepToken;
    const existing = this.getAllSubmissions();
    const recentDuplicate = existing.find(
      (sub) => sub.phone === payload.phone && sub.studentName === payload.studentName && Date.now() - new Date(sub.submittedAt).getTime() < 30000
    );
    if (recentDuplicate) {
      return {
        success: true,
        data: recentDuplicate,
        duplicateSuppressed: true,
        message: 'Your inquiry was recently received. Redirecting to confirmation.',
        whatsappUrl: this.generateWhatsAppUrl(recentDuplicate),
      };
    }

    payload.id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    payload.submittedAt = new Date().toISOString();

    const isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
      ? navigator.onLine 
      : true;

    if (!isOnline) {
      this._enqueueOffline(payload);
      this._recordSubmission(payload);
      return {
        success: true,
        offlineQueued: true,
        data: payload,
        message: 'Saved offline. Your inquiry will automatically sync once your connection returns.',
        whatsappUrl: this.generateWhatsAppUrl(payload),
      };
    }

    const webhookUrl = this.getWebhookUrl();

    if (webhookUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, stepToken }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Webhook responded with status ${response.status}`);
        }
      } catch {
        this._enqueueOffline(payload);
        this._recordSubmission(payload);
        return {
          success: true,
          offlineQueued: true,
          data: payload,
          message: 'Saved locally due to server delay. Will retry automatically.',
          whatsappUrl: this.generateWhatsAppUrl(payload),
        };
      }
    }

    this._recordSubmission(payload);
    this._dispatchLeadEvent(payload);

    return {
      success: true,
      offlineQueued: false,
      data: payload,
      message: 'Inquiry received. Campus counselor will contact you within 2 hours.',
      whatsappUrl: this.generateWhatsAppUrl(payload),
    };
  },

  generateWhatsAppUrl(lead) {
    const phone = CAMPUS_CONFIG.contact.whatsappNumber;
    const text = encodeURIComponent(
      `Hello Focus Academy, Thoramangalam! 👋\n\nI want to enroll in Evening Batches.\n\n• Student: ${lead.studentName}\n• Parent: ${lead.parentName || 'Parent'}\n• Class: ${lead.grade} (${lead.board})\n• Contact: +91 ${lead.phone}\n• Selected Batch/Subjects: ${lead.subjects || 'Core Subjects'}\n\nPlease share admission details.`
    );
    return `https://wa.me/${phone}?text=${text}`;
  },

  _enqueueOffline(lead) {
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_QUEUE_KEY) || '[]');
      queue.push({ ...lead, queuedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    } catch {
    }
  },

  _recordSubmission(lead) {
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_LOGS_KEY) || '[]');
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const activeLogs = logs.filter(item => {
        const t = item.submittedAt ? new Date(item.submittedAt).getTime() : 0;
        return t > oneHourAgo;
      });
      const existingIdx = activeLogs.findIndex((item) => (item.id && item.id === lead.id) || (item.phone === lead.phone && item.studentName === lead.studentName));
      if (existingIdx >= 0) {
        activeLogs[existingIdx] = lead;
      } else {
        activeLogs.unshift(lead);
      }
      if (activeLogs.length > 20) activeLogs.pop();
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(activeLogs));
    } catch {
    }
  },

  _dispatchLeadEvent(lead) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        const event = new CustomEvent('focus-academy:lead-captured', { detail: lead });
        window.dispatchEvent(event);
      } catch {
      }
    }
  },

  async syncOfflineQueue() {
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_QUEUE_KEY) || '[]');
      if (!queue.length) return 0;

      const webhookUrl = this.getWebhookUrl();
      const remaining = [];

      for (const lead of queue) {
        if (webhookUrl) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lead),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              remaining.push(lead);
            } else {
              this._recordSubmission(lead);
            }
          } catch {
            remaining.push(lead);
          }
        } else {
          this._recordSubmission(lead);
        }
      }

      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(remaining));
      return queue.length - remaining.length;
    } catch {
      return 0;
    }
  },

  getQueuedLeadsCount() {
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_QUEUE_KEY) || '[]');
      return queue.length;
    } catch {
      return 0;
    }
  },

  getAllSubmissions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LOGS_KEY) || '[]');
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
