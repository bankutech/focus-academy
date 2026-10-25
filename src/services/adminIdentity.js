import { auth } from './firebase';

let verifiedAdmin = null;
const listeners = new Set();

export const setVerifiedAdmin = (profile) => {
  verifiedAdmin = profile && profile.email
    ? {
        uid: profile.uid || null,
        email: String(profile.email).trim().toLowerCase(),
        displayName: profile.displayName || String(profile.email).split('@')[0],
        claims: profile.claims || {},
      }
    : null;
  listeners.forEach((fn) => fn(verifiedAdmin));
};

export const getVerifiedAdmin = () => verifiedAdmin;

export const getVerifiedAdminEmail = () => {
  if (verifiedAdmin?.email) return verifiedAdmin.email;
  const live = auth?.currentUser?.email;
  return live ? live.trim().toLowerCase() : null;
};

export const requireAdminEmail = () => {
  const email = getVerifiedAdminEmail();
  if (!email) {
    throw new Error('Your sign-in has expired. Please sign in again to continue.');
  }
  return email;
};

export const subscribeVerifiedAdmin = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getAdminIdToken = async () => {
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken();
};
