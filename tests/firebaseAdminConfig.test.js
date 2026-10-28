import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseServiceAccount,
  getServiceStatus,
  resetServiceCache,
  expectedProjectId,
} from '../api/_lib/firebaseAdmin.js';

const PEM = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg\n-----END PRIVATE KEY-----\n';

const account = (overrides = {}) => ({
  project_id: 'focus-academy-7efeb',
  client_email: 'admin@focus-academy-7efeb.iam.gserviceaccount.com',
  private_key: PEM,
  ...overrides,
});

describe('Firebase service-account configuration', () => {
  beforeEach(() => {
    resetServiceCache();
  });

  afterEach(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    delete process.env.FIREBASE_PROJECT_ID;
    resetServiceCache();
  });

  it('accepts raw service-account JSON', () => {
    const result = parseServiceAccount(JSON.stringify(account()));
    expect(result.ok).toBe(true);
    expect(result.format).toBe('json');
    expect(result.value.project_id).toBe('focus-academy-7efeb');
  });

  it('accepts base64 encoded service-account JSON', () => {
    const encoded = Buffer.from(JSON.stringify(account()), 'utf8').toString('base64');
    const result = parseServiceAccount(encoded);
    expect(result.ok).toBe(true);
    expect(result.format).toBe('base64');
  });

  it('accepts a quoted value pasted from a hosting dashboard', () => {
    const result = parseServiceAccount(`"${JSON.stringify(account())}"`);
    expect(result.ok).toBe(true);
  });

  it('repairs a private key whose newlines were double-escaped on paste', () => {
    const escaped = { ...account(), private_key: PEM.replace(/\n/g, '\\n') };
    const result = parseServiceAccount(JSON.stringify(escaped));
    expect(result.ok).toBe(true);
    expect(result.value.private_key).toContain('\n');
    expect(result.value.private_key).not.toContain('\\n');
  });

  it('tolerates whitespace and a UTF-8 BOM around the JSON', () => {
    const result = parseServiceAccount(`\uFEFF  ${JSON.stringify(account())}  \n`);
    expect(result.ok).toBe(true);
  });

  it('rejects incomplete credentials with a precise reason', () => {
    const result = parseServiceAccount(JSON.stringify({ project_id: 'focus-academy-7efeb' }));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('incomplete_credentials');
    expect(result.missingFields).toEqual(['private_key', 'client_email']);
  });

  it('rejects a private key that is not a PEM key', () => {
    const result = parseServiceAccount(JSON.stringify(account({ private_key: 'not-a-pem' })));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('malformed_private_key');
  });

  it('rejects malformed JSON without throwing', () => {
    const result = parseServiceAccount('{not-json');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('malformed_credentials');
  });

  it('reports missing configuration by variable name without exposing values', () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    const status = getServiceStatus();
    expect(status.ready).toBe(false);
    expect(status.reason).toBe('missing_environment');
    expect(status.detail).toContain('FIREBASE_SERVICE_ACCOUNT');
  });

  it('does not report an uninitialised service as ready even when the variable exists', () => {
    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(account());
    const status = getServiceStatus();
    expect(status.ready).toBe(false);
    expect(status.reason).toBe('not_initialized');
  });

  it('targets the production project by default and honours an explicit override', () => {
    expect(expectedProjectId()).toBe('focus-academy-7efeb');
    process.env.FIREBASE_PROJECT_ID = 'focus-academy-staging';
    expect(expectedProjectId()).toBe('focus-academy-staging');
  });
});
