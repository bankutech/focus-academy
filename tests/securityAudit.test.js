import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFakeServices } from './helpers/fakeFirestore.js';

const holder = vi.hoisted(() => ({ current: null }));
vi.mock('../api/_lib/firebaseAdmin.js', () => ({ getServices: () => holder.current?.services || null }));

import sessionHandler from '../api/session.js';
import leadsHandler from '../api/leads.js';
import batchesHandler from '../api/batches.js';
import whatsappHandler from '../api/whatsapp.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, val) {
      this.headers[name] = val;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
  return res;
}

let fake;

describe('Security & Authorization Hardening Audit Tests', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'k'.repeat(48);
    fake = createFakeServices();
    holder.current = fake;

    fake.seed('academy_settings', 'main_config', {
      authorizedAdmins: [
        { email: 'coordinator@focusacademyperambalur.com', role: 'fee_manager', active: true },
      ],
    });
    fake.addAccount('admin-token', { uid: 'admin-1', email: 'coordinator@focusacademyperambalur.com', email_verified: true });

    fake.seed('batches', 'batch-10-state-board', {
      id: 'batch-10-state-board',
      name: 'Class 10 State Board',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      capacity: 12,
      enrolledCount: 8,
      isArchived: false,
    });
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
    holder.current = null;
  });

  it('enforces nosniff and strict content type headers across serverless endpoints', async () => {
    const res = createMockRes();
    const req = {
      method: 'GET',
      headers: { 'x-forwarded-for': '192.168.1.100' },
      query: { token: 'v1.fake' }
    };

    await sessionHandler(req, res);
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(res.headers['Content-Type']).toBe('application/json');
  });

  it('rejects oversized JSON payloads on leads endpoint with HTTP 413', async () => {
    const res = createMockRes();
    const giantString = 'A'.repeat(9000);
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.101' },
      body: {
        studentName: 'Praveen',
        phone: '9842451220',
        notes: giantString
      }
    };

    await leadsHandler(req, res);
    expect(res.statusCode).toBe(413);
    expect(res.body.success).toBe(false);
  });

  it('sanitizes XSS injection payloads and script tags from lead inquiries', async () => {
    const res = createMockRes();
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.102' },
      body: {
        studentName: '<script>alert("pwned")</script>S. Kaviya',
        phone: '9842451220',
        grade: 'Class 10<img src=x onerror=alert(1)>',
        board: 'State Board'
      }
    };

    await leadsHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.studentName).not.toContain('<');
    expect(res.body.data.studentName).not.toContain('>');
    expect(res.body.data.studentName).not.toContain('"');
    expect(res.body.data.grade).not.toContain('<');
  });

  it('enforces rate limiting on admission inquiries returning HTTP 429 after burst attempts', async () => {
    const burstIp = '10.0.0.99';
    let lastStatusCode = 200;

    for (let i = 0; i < 12; i++) {
      const res = createMockRes();
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': burstIp },
        body: {
          studentName: `Student ${i}`,
          phone: '9842451220',
          grade: 'Class 10',
          board: 'State Board'
        }
      };
      await leadsHandler(req, res);
      lastStatusCode = res.statusCode;
    }

    expect(lastStatusCode).toBe(429);
  });

  it('enforces rate limiting on seat reservation endpoint returning HTTP 429 after 15 requests', async () => {
    const burstIp = '10.0.0.88';
    let rateLimited = false;

    for (let i = 0; i < 18; i++) {
      const res = createMockRes();
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': burstIp },
        body: { batchId: 'batch-10-state-board' }
      };
      await batchesHandler(req, res);
      if (res.statusCode === 429) {
        rateLimited = true;
        break;
      }
    }

    expect(rateLimited).toBe(true);
  });

  it('rejects tampered and forged HMAC tokens with HTTP 401', async () => {
    const mintRes = createMockRes();
    const mintReq = {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.150' },
      body: { step: 2, phone: '9842451220', studentName: 'S. Kaviya', grade: 'Class 10', board: 'TN State Board (Samacheer)' }
    };
    await sessionHandler(mintReq, mintRes);
    expect(mintRes.statusCode).toBe(200);
    const validToken = mintRes.body.token;

    // Tampered token signature passed to seat reservation endpoint (/api/batches)
    const tamperedRes = createMockRes();
    const tamperedReq = {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.151' },
      body: {
        batchId: 'batch-10-state-board',
        studentName: 'S. Kaviya',
        phone: '9842451220',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        stepToken: `${validToken.slice(0, -4)}0000`
      }
    };
    await batchesHandler(tamperedReq, tamperedRes);
    expect(tamperedRes.statusCode).toBe(401);
    expect(tamperedRes.body.success).toBe(false);

    // Completely forged step-4 token passed to leads endpoint (/api/leads)
    const forgedRes = createMockRes();
    const forgedReq = {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.152' },
      body: {
        batchId: 'batch-10-state-board',
        reservationId: 'RES-123456',
        studentName: 'Imposter',
        phone: '9842451220',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        stepToken: 'v2.APP-FORGED.4.9999999999999.deadbeefdeadbeef'
      }
    };
    await leadsHandler(forgedReq, forgedRes);
    expect(forgedRes.statusCode).toBe(401);
    expect(forgedRes.body.success).toBe(false);
  });

  describe('WhatsApp Serverless Endpoint (/api/whatsapp) Audit', () => {
    it('rejects unauthorized callers without admin credentials with HTTP 401', async () => {
      const anonRes = createMockRes();
      const anonReq = {
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.160' }
      };
      await whatsappHandler(anonReq, anonRes);
      expect(anonRes.statusCode).toBe(401);
      expect(anonRes.body.success).toBe(false);

      const unverifiedRes = createMockRes();
      const unverifiedReq = {
        method: 'GET',
        headers: {
          authorization: 'Bearer bad-token',
          'x-forwarded-for': '192.168.1.160'
        }
      };
      await whatsappHandler(unverifiedReq, unverifiedRes);
      expect(unverifiedRes.statusCode).toBe(401);
    });

    it('returns gateway operational status and security headers via authenticated GET', async () => {
      const res = createMockRes();
      const req = {
        method: 'GET',
        headers: {
          authorization: 'Bearer admin-token',
          'x-forwarded-for': '192.168.1.160'
        }
      };
      await whatsappHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(res.body.success).toBe(true);
      expect(res.body.deliveryChannel).toBe('manual_click_to_chat_fallback');
    });

    it('rejects missing or invalid fee obligations with HTTP 400 and HTTP 404', async () => {
      const badReqRes = createMockRes();
      const badReq = {
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'x-forwarded-for': '192.168.1.161'
        },
        body: {}
      };
      await whatsappHandler(badReq, badReqRes);
      expect(badReqRes.statusCode).toBe(400);
      expect(badReqRes.body.success).toBe(false);
      expect(badReqRes.body.error).toContain('obligationId is required');

      const notFoundRes = createMockRes();
      const notFoundReq = {
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'x-forwarded-for': '192.168.1.161'
        },
        body: { obligationId: 'NONEXISTENT-OBL' }
      };
      await whatsappHandler(notFoundReq, notFoundRes);
      expect(notFoundRes.statusCode).toBe(404);
      expect(notFoundRes.body.success).toBe(false);
    });

    it('returns structured manual fallback with RFC-encoded link when Cloud API unconfigured', async () => {
      fake.seed('students', 'STU-100', { studentName: 'S. Kaviya', guardianPhone: '9842451220' });
      fake.seed('fee_obligations', 'OBL-100', {
        studentId: 'STU-100',
        studentName: 'S. Kaviya',
        amountDue: 3200,
        amountPaid: 0,
        waivedAmount: 0,
        dueDate: '2026-11-05',
        status: 'pending'
      });

      const res = createMockRes();
      const req = {
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
          'x-forwarded-for': '192.168.1.162'
        },
        body: {
          obligationId: 'OBL-100',
          reminderType: 'upcoming'
        }
      };
      await whatsappHandler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mode).toBe('manual_fallback');
      expect(res.body.automated).toBe(false);
      expect(res.body.clickToChatUrl).toContain('https://wa.me/919842451220');
      expect(res.body.clickToChatUrl).toContain('Focus%20Academy');
      expect(res.body.message).toContain('₹3200');
    });

    it('enforces rate limiting on WhatsApp endpoint returning HTTP 429 after burst attempts', async () => {
      const burstIp = '10.0.0.77';
      let rateLimited = false;

      for (let i = 0; i < 35; i++) {
        const res = createMockRes();
        const req = {
          method: 'POST',
          headers: {
            authorization: 'Bearer admin-token',
            'x-forwarded-for': burstIp
          },
          body: {
            obligationId: `OBL-${i}`
          }
        };
        await whatsappHandler(req, res);
        if (res.statusCode === 429) {
          rateLimited = true;
          break;
        }
      }

      expect(rateLimited).toBe(true);
    });
  });
});
