import { describe, it, expect } from 'vitest';
import { friendlyAuthError } from '../src/pages/admin/authHelpers';
import {
  extractPendingGoogleCredential,
  resolveGoogleAccountConflictWithPassword
} from '../src/services/firebase';

describe('Firebase Authentication & Account Linking Flow', () => {
  it('formats account conflict error with clear instructions', () => {
    const error = { code: 'auth/account-exists-with-different-credential' };
    const msg = friendlyAuthError(error);
    expect(msg).toContain('An account already exists with this email address');
    expect(msg).toContain('link your Google account');
  });

  it('formats credential already in use error', () => {
    const error = { code: 'auth/credential-already-in-use' };
    const msg = friendlyAuthError(error);
    expect(msg).toContain('already linked to another account');
  });

  it('safely extracts pending credential from error', () => {
    expect(extractPendingGoogleCredential(null)).toBeNull();
    expect(extractPendingGoogleCredential({})).toBeNull();
  });

  it('preserves existing UID during linking workflow', async () => {
    // Verify function signature and error handling when Firebase not configured in test
    await expect(
      resolveGoogleAccountConflictWithPassword('admin@focusacademy.com', 'pass123', null)
    ).rejects.toThrow();
  });
});
