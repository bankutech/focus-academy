import { describe, it, expect } from 'vitest';
import sessionHandler from '../api/session.js';
import leadsHandler from '../api/leads.js';
import batchesHandler from '../api/batches.js';

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

describe('Security & Authorization Hardening Audit Tests', () => {
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
      body: { step: 3, phone: '9842451220', studentName: 'S. Kaviya' }
    };
    await sessionHandler(mintReq, mintRes);
    expect(mintRes.statusCode).toBe(200);
    const validToken = mintRes.body.token;

    const verifyRes = createMockRes();
    const verifyReq = {
      method: 'GET',
      headers: { 'x-forwarded-for': '192.168.1.151' },
      query: { token: validToken, step: 3, phone: '9842451220', studentName: 'Imposter' }
    };
    await sessionHandler(verifyReq, verifyRes);
    expect(verifyRes.statusCode).toBe(401);
    expect(verifyRes.body.valid).toBe(false);
  });
});
