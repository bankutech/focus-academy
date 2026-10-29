import { describe, it, expect, beforeEach } from 'vitest';
import { initializeAdmin } from '../scripts/initializeAdmin';

describe('Initial Administrator Provisioning Script', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.INITIAL_ADMIN_EMAIL;
  });

  it('rejects execution when administrator email is missing', async () => {
    await expect(initializeAdmin({ email: '' })).rejects.toThrow(
      'A valid administrator email must be provided'
    );
  });

  it('rejects execution when email format is invalid', async () => {
    await expect(initializeAdmin({ email: 'invalid-email' })).rejects.toThrow(
      'A valid administrator email must be provided'
    );
  });

  it('rejects execution when assigned role is not an allowed system role', async () => {
    await expect(initializeAdmin({ email: 'test@example.com', role: 'super_hacker' })).rejects.toThrow(
      "Invalid administrator role 'super_hacker'"
    );
  });

  it('rejects execution safely when Firebase credentials are not configured', async () => {
    await expect(initializeAdmin({ email: 'director@focusacademyperambalur.com', role: 'owner' })).rejects.toThrow(
      'Missing Firebase credentials'
    );
  });
});
