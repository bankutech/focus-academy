import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createFakeServices, mockResponse } from './helpers/fakeFirestore.js';

const readJson = (relativePath) =>
  JSON.parse(readFileSync(resolve(process.cwd(), relativePath), 'utf8'));

const holder = vi.hoisted(() => ({
  current: null,
  status: { ready: false, reason: 'missing_environment', detail: 'Missing required environment variables: FIREBASE_SERVICE_ACCOUNT' },
}));
vi.mock('../api/_lib/firebaseAdmin.js', () => ({
  getServices: async () => holder.current?.services || null,
  getServiceStatus: () => holder.status,
  getServiceAccountProjectId: () => holder.status.projectId || null,
  expectedProjectId: () => 'focus-academy-7efeb',
  missingEnvironment: () => [],
  resetServiceCache: () => {},
}));

import healthHandler from '../api/health.js';
import sessionHandler from '../api/session.js';
import leadsHandler from '../api/leads.js';
import batchesHandler from '../api/batches.js';
import whatsappHandler from '../api/whatsapp.js';

const call = async (handler, { method = 'GET', body, headers = {}, url = '/api/test' } = {}) => {
  const res = mockResponse();
  await handler({ method, body, headers, url, socket: {} }, res);
  return res;
};

describe('Runtime compatibility guard (root cause of the 2026-10-26 outage)', () => {
  it('pins a Node runtime that supports require(ESM), which firebase-admin 14 needs for jwks-rsa/jose', async () => {
    const pkg = readJson('package.json');
    expect(pkg.engines?.node, 'package.json must declare engines.node').toBeTruthy();

    const match = /(\d+)\.(\d+)/.exec(pkg.engines.node);
    expect(match, 'engines.node must be parseable').toBeTruthy();
    const major = Number(match[1]);
    expect(major, `engines.node (${pkg.engines.node}) must be >= 22 for require(ESM) support`).toBeGreaterThanOrEqual(22);
  });

  it('firebase-admin declares a Node requirement that matches our pinned runtime', async () => {
    const admin = readJson('node_modules/firebase-admin/package.json');
    const pkg = readJson('package.json');
    const adminMajor = Number(/(\d+)/.exec(admin.engines.node)[1]);
    const ours = Number(/(\d+)/.exec(pkg.engines.node)[1]);
    expect(ours, `our engines.node must satisfy firebase-admin's ${admin.engines.node}`).toBeGreaterThanOrEqual(adminMajor);
  });
});

describe('GET /api/health', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'k'.repeat(48);
    holder.current = createFakeServices();
    holder.status = { ready: true, reason: 'ready', projectId: 'focus-academy-7efeb', credentialFormat: 'json' };
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
    holder.current = null;
  });

  it('reports 200 only when configuration, secret and a real Firestore round-trip all succeed', async () => {
    const res = await call(healthHandler);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ready');
    expect(res.body.checks.node_runtime.ok).toBe(true);
    expect(res.body.checks.step_token_secret.ok).toBe(true);
    expect(res.body.checks.firestore.ok).toBe(true);
  });

  it('returns 503 when required environment variables are missing', async () => {
    holder.status = { ready: false, reason: 'missing_environment', detail: 'Missing required environment variables: FIREBASE_SERVICE_ACCOUNT' };
    const res = await call(healthHandler);
    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.checks.firestore.detail).toContain('FIREBASE_SERVICE_ACCOUNT');
  });

  it('returns 503 when the step-token secret is missing even if the database is reachable', async () => {
    delete process.env.SESSION_SECRET;
    const res = await call(healthHandler);
    expect(res.statusCode).toBe(503);
    expect(res.body.checks.step_token_secret.ok).toBe(false);
    expect(res.body.checks.firestore.ok).toBe(true);
  });

  it('returns 503 when the Firestore round-trip fails', async () => {
    holder.current.services.db.collection = () => ({
      limit: () => ({ get: async () => { throw new Error('permission-denied'); } }),
    });
    const res = await call(healthHandler);
    expect(res.statusCode).toBe(503);
    expect(res.body.checks.firestore.ok).toBe(false);
  });

  it('rejects non-GET methods with 405 and an Allow header', async () => {
    const res = await call(healthHandler, { method: 'POST' });
    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('GET');
  });

  it('never leaks configuration values in the health payload', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT = '{"private_key":"SUPER_SECRET_KEY_MATERIAL"}';
    const res = await call(healthHandler);
    expect(JSON.stringify(res.body)).not.toContain('SUPER_SECRET_KEY_MATERIAL');
  });
});

describe('Supported methods per handler (documented contract)', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'k'.repeat(48);
    holder.current = createFakeServices();
    holder.status = { ready: true, reason: 'ready' };
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
    holder.current = null;
  });

  it('GET /api/batches is supported (public availability read)', async () => {
    const res = await call(batchesHandler);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/batches is supported (reservation write)', async () => {
    const res = await call(batchesHandler, { method: 'POST', body: {} });
    expect(res.statusCode).not.toBe(405);
  });

  it('POST /api/session is supported; GET is rejected with 405', async () => {
    expect((await call(sessionHandler, { method: 'POST', body: {} })).statusCode).not.toBe(405);
    expect((await call(sessionHandler)).statusCode).toBe(405);
  });

  it('POST /api/leads is supported; GET is rejected with 405', async () => {
    expect((await call(leadsHandler, { method: 'POST', body: {} })).statusCode).not.toBe(405);
    expect((await call(leadsHandler)).statusCode).toBe(405);
  });

  it('GET /api/whatsapp is supported and still requires an authenticated fee manager', async () => {
    const res = await call(whatsappHandler);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('every handler answers with JSON and a success flag on unsupported methods', async () => {
    for (const [handler, method] of [[sessionHandler, 'DELETE'], [leadsHandler, 'PUT'], [batchesHandler, 'PATCH']]) {
      const res = await call(handler, { method });
      expect(res.statusCode).toBe(405);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
      expect(res.headers['Content-Type']).toBe('application/json');
    }
  });
});

describe('Unexpected failures are 500s, not friendly 503s', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'k'.repeat(48);
    holder.current = createFakeServices();
    holder.status = { ready: true, reason: 'ready' };
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
    holder.current = null;
    vi.restoreAllMocks();
  });

  it('turns an unexpected handler exception into a sanitized 500 without leaking internals', async () => {
    holder.current.services.db.collection = () => {
      throw Object.assign(new Error('secret internal detail xyz'), { code: 'internal' });
    };
    const res = await call(batchesHandler);
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('secret internal detail');
    expect(res.body.error).toMatch(/call the campus desk/i);
  });

  it('still returns a structured 503 (not a crash) when services are unavailable', async () => {
    holder.current = null;
    const res = await call(leadsHandler, { method: 'POST', body: {} });
    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
  });
});

describe('Node runtime pinned in package.json', () => {
  it('declares an engines.node that the deployment platform will honour', () => {
    const pkg = readJson('package.json');
    expect(pkg.engines.node).toMatch(/>=\s*22/);
  });
});
