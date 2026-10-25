import { describe, it, expect, beforeEach } from 'vitest';
import { friendlyAuthError, passwordStrength, readLock, recordFailure, clearFailures, LOCK_AFTER } from '../src/pages/admin/authHelpers';

describe('Login helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('never tells an attacker whether the email or the password was wrong', () => {
    const wrong = friendlyAuthError({ code: 'auth/wrong-password' });
    expect(wrong).toBe(friendlyAuthError({ code: 'auth/user-not-found' }));
    expect(wrong).toBe(friendlyAuthError({ code: 'auth/invalid-credential' }));
  });

  it('hides raw provider text behind a plain sentence', () => {
    expect(friendlyAuthError({ code: 'auth/some-new-code', message: 'Firebase: Error (auth/some-new-code).' })).toBe('Sign-in failed. Please try again.');
    expect(friendlyAuthError({ code: 'auth/network-request-failed' })).toMatch(/connection/i);
    expect(friendlyAuthError(null)).toMatch(/try again/i);
  });

  it('scores passwords and rejects short or lazy ones', () => {
    expect(passwordStrength('').acceptable).toBe(false);
    expect(passwordStrength('abc12').label).toBe('Too short');
    expect(passwordStrength('password1234').acceptable).toBe(false);
    expect(passwordStrength('aaaaaaaaaaaa').acceptable).toBe(false);
    expect(passwordStrength('Focus2026desk').acceptable).toBe(true);
    expect(passwordStrength('Focus!2026-Desk#9').score).toBe(4);
  });

  it('locks the form after repeated failures and resets on success', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < LOCK_AFTER - 1; i += 1) recordFailure(t0);
    expect(readLock(t0).until).toBe(0);
    const locked = recordFailure(t0);
    expect(locked.until).toBeGreaterThan(t0);
    expect(readLock(t0 + 1000).until).toBe(locked.until);
    expect(readLock(locked.until + 1).failures).toBe(0);
    clearFailures();
    expect(readLock(t0).failures).toBe(0);
  });
});
