import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeadService } from '../src/services/leadService';

describe('LeadService', () => {
  beforeEach(() => {
    const storage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { storage[key] = String(value); },
      removeItem: (key) => { delete storage[key]; },
      clear: () => {
        for (const key of Object.keys(storage)) {
          delete storage[key];
        }
      },
    });
  });

  it('generates a valid WhatsApp click-to-chat URL with prefilled student details', () => {
    const lead = {
      studentName: 'Praveen',
      parentName: 'Murugan',
      phone: '9842451220',
      grade: 'Class 12',
      board: 'State Board',
      subjects: 'Physics & Chemistry',
    };

    const url = LeadService.generateWhatsAppUrl(lead);
    expect(url).toContain('https://wa.me/919842451220');
    expect(url).toContain(encodeURIComponent('Praveen'));
    expect(url).toContain(encodeURIComponent('Class 12'));
  });

  it('reports delivery only after the server confirms the lead', async () => {
    const lead = {
      studentName: 'Ananya S',
      phone: '9842451220',
      grade: 'Class 9',
      board: 'CBSE',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: 'FA-SERVER-1' } }),
    });

    try {
      const result = await LeadService.submitLead(lead);
      expect(result.success).toBe(true);
      expect(result.status).toBe('delivered');
      expect(result.offlineQueued).toBe(false);
      expect(result.data.id).toBe('FA-SERVER-1');
      expect(result.data.serverConfirmed).toBe(true);
      expect(result.whatsappUrl).toBeDefined();

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = globalThis.fetch.mock.calls[0];
      expect(url).toBe('/api/leads');
      expect(options.headers['Idempotency-Key']).toBeTruthy();

      const submissions = LeadService.getAllSubmissions();
      expect(submissions.length).toBe(1);
      expect(submissions[0].studentName).toBe('Ananya S');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does NOT report success when the server rejects the lead', async () => {
    const lead = { studentName: 'Ravi K', phone: '9842451221', grade: 'Class 10', board: 'CBSE' };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Server exploded' }),
    });

    try {
      const result = await LeadService.submitLead(lead);
      expect(result.success).toBe(false);
      expect(result.status).toBe('queued_locally');
      expect(result.retryable).toBe(true);
      expect(result.message).toContain('Server exploded');
      expect(result.whatsappUrl).toBeDefined();
      expect(LeadService.getQueuedLeadsCount()).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does NOT report success when the network request throws', async () => {
    const lead = { studentName: 'Meena P', phone: '9842451222', grade: 'Class 11', board: 'State Board' };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      const result = await LeadService.submitLead(lead);
      expect(result.success).toBe(false);
      expect(result.status).toBe('queued_locally');
      expect(result.data.studentName).toBe('Meena P');
      expect(result.message).toMatch(/could not be reached/i);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does NOT report success when the device is offline', async () => {
    const lead = { studentName: 'Kumar V', phone: '9842451223', grade: 'Class 12', board: 'CBSE' };

    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();

    try {
      const result = await LeadService.submitLead(lead);
      expect(result.success).toBe(false);
      expect(result.status).toBe('queued_locally');
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(LeadService.getQueuedLeadsCount()).toBe(1);
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnLine });
      globalThis.fetch = originalFetch;
    }
  });

  it('reuses the same idempotency key across retries so the server can deduplicate', async () => {
    const lead = { studentName: 'Idem Test', phone: '9842451224', grade: 'Class 10', board: 'CBSE' };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    try {
      const first = await LeadService.submitLead(lead);
      expect(first.success).toBe(false);
      const queued = LeadService.getQueuedLeads()[0];
      expect(queued.idempotencyKey).toBeTruthy();

      const second = await LeadService.retryLastAttempt(queued);
      expect(second.success).toBe(false);

      const keys = globalThis.fetch.mock.calls.map(([, options]) => options.headers['Idempotency-Key']);
      expect(keys[0]).toBe(keys[1]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('stores only a minimal receipt in the submission log, not the full personal record', async () => {
    const lead = {
      studentName: 'Privacy Test',
      phone: '9842451225',
      grade: 'Class 10',
      board: 'CBSE',
      medicalAlert: 'Has a severe peanut allergy',
      emergencyPhone: '9842400001',
      addressStreet: '12 Gandhi Street',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, data: {} }) });

    try {
      const result = await LeadService.submitLead(lead);
      expect(result.success).toBe(true);

      const raw = JSON.parse(localStorage.getItem('focus_academy_submitted_leads_v1'));
      expect(JSON.stringify(raw)).not.toContain('peanut allergy');
      expect(JSON.stringify(raw)).not.toContain('9842400001');
      expect(JSON.stringify(raw)).not.toContain('Gandhi Street');
      expect(raw[0].studentName).toBe('Privacy Test');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('rejects invalid lead submission without saving', async () => {
    const invalidLead = {
      studentName: '',
      phone: '123',
    };

    const result = await LeadService.submitLead(invalidLead);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();

    const submissions = LeadService.getAllSubmissions();
    expect(submissions.length).toBe(0);
  });

  it('preserves queued leads when sync request encounters HTTP error', async () => {
    const queueItem = {
      id: 'lead-test-1',
      studentName: 'Vignesh',
      phone: '9842451220',
      grade: 'Class 10',
      board: 'State Board',
    };
    LeadService._enqueueOffline(queueItem);
    expect(LeadService.getQueuedLeadsCount()).toBe(1);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server Error' }),
    });

    const syncedCount = await LeadService.syncOfflineQueue();
    expect(syncedCount).toBe(0);
    expect(LeadService.getQueuedLeadsCount()).toBe(1);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const successfulSyncCount = await LeadService.syncOfflineQueue();
    expect(successfulSyncCount).toBe(1);
    expect(LeadService.getQueuedLeadsCount()).toBe(0);

    globalThis.fetch = originalFetch;
  });
});
