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

  it('successfully captures a valid lead inquiry and stores it', async () => {
    const lead = {
      studentName: 'Ananya S',
      phone: '9842451220',
      grade: 'Class 9',
      board: 'CBSE',
    };

    const result = await LeadService.submitLead(lead);
    expect(result.success).toBe(true);
    expect(result.data.studentName).toBe('Ananya S');
    expect(result.whatsappUrl).toBeDefined();

    const submissions = LeadService.getAllSubmissions();
    expect(submissions.length).toBe(1);
    expect(submissions[0].studentName).toBe('Ananya S');
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
