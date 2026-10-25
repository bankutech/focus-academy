const MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/user-disabled': 'This account has been disabled. Contact the academy owner.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes, or reset your password.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
  'auth/cancelled-popup-request': 'Google sign-in was closed before it finished.',
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site and try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead, or reset your password.',
  'auth/weak-password': 'Choose a stronger password.',
  'auth/email-not-verified': 'Verify your email first. Open the link we sent you, then sign in.',
  'auth/unauthorized-domain': 'This website address is not authorized for Google sign-in.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled yet.',
};

export const friendlyAuthError = (err) => {
  if (!err) return 'Something went wrong. Please try again.';
  if (MESSAGES[err.code]) return MESSAGES[err.code];
  if (typeof err.message === 'string' && err.message && !/^Firebase/i.test(err.message) && !err.code) return err.message;
  return 'Sign-in failed. Please try again.';
};

export const passwordChecks = (value = '') => ({
  length: value.length >= 10,
  letter: /[A-Za-z]/.test(value),
  number: /\d/.test(value),
  mixed: /[a-z]/.test(value) && /[A-Z]/.test(value),
  symbol: /[^A-Za-z0-9]/.test(value),
});

export const passwordStrength = (value = '') => {
  const checks = passwordChecks(value);
  if (!value) return { score: 0, label: '', acceptable: false };
  if (value.length < 10) return { score: 0, label: 'Too short', acceptable: false };
  let score = 0;
  if (checks.length) score += 1;
  if (checks.letter && checks.number) score += 1;
  if (checks.mixed) score += 1;
  if (checks.symbol || value.length >= 14) score += 1;
  if (/^(.)\1+$/.test(value) || /^(password|12345|qwerty)/i.test(value)) score = Math.min(score, 1);
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score], acceptable: checks.length && checks.letter && checks.number && score >= 2 };
};

export const LOCK_AFTER = 5;
export const LOCK_SECONDS = 30;
const LOCK_KEY = 'fa_login_lock';

export const readLock = (now = Date.now()) => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(LOCK_KEY) || 'null');
    if (!raw) return { failures: 0, until: 0 };
    if (raw.until && raw.until <= now) return { failures: 0, until: 0 };
    return { failures: raw.failures || 0, until: raw.until || 0 };
  } catch {
    return { failures: 0, until: 0 };
  }
};

export const recordFailure = (now = Date.now()) => {
  const current = readLock(now);
  const failures = current.failures + 1;
  const until = failures >= LOCK_AFTER ? now + LOCK_SECONDS * 1000 * Math.min(4, failures - LOCK_AFTER + 1) : 0;
  try {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify({ failures, until }));
  } catch {
    return { failures, until };
  }
  return { failures, until };
};

export const clearFailures = () => {
  try {
    sessionStorage.removeItem(LOCK_KEY);
  } catch {
    return;
  }
};
