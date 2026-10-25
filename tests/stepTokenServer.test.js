import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mintToken, readToken, hasSecret } from '../api/_lib/stepToken.js';

const SECRET = 'k'.repeat(48);

describe('Server step tokens', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it('refuses to operate without a strong secret', () => {
    delete process.env.SESSION_SECRET;
    expect(hasSecret()).toBe(false);
    expect(readToken('v2.APP-1.4.9999999999999.abc')).toBeNull();
    process.env.SESSION_SECRET = 'short';
    expect(hasSecret()).toBe(false);
  });

  it('round-trips a freshly minted token', () => {
    const { token } = mintToken('APP-ABC123', 4);
    expect(readToken(token)).toMatchObject({ applicationId: 'APP-ABC123', step: 4 });
  });

  it('rejects forged step numbers, swapped application ids and truncated signatures', () => {
    const { token } = mintToken('APP-ABC123', 2);
    const parts = token.split('.');
    expect(readToken([parts[0], parts[1], '4', parts[3], parts[4]].join('.'))).toBeNull();
    expect(readToken([parts[0], 'APP-OTHER', parts[2], parts[3], parts[4]].join('.'))).toBeNull();
    expect(readToken(`${token.slice(0, -4)}0000`)).toBeNull();
    expect(readToken('v1.4.123.456.deadbeef')).toBeNull();
    expect(readToken('')).toBeNull();
  });

  it('rejects tokens signed with a different secret and expired tokens', () => {
    const { token } = mintToken('APP-ABC123', 3);
    process.env.SESSION_SECRET = 'z'.repeat(48);
    expect(readToken(token)).toBeNull();
    process.env.SESSION_SECRET = SECRET;
    const [version, id, step, , signature] = token.split('.');
    expect(readToken([version, id, step, String(Date.now() - 1000), signature].join('.'))).toBeNull();
  });
});
