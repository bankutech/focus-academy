import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const readCredentials = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const getServices = () => {
  const credentials = readCredentials();
  if (!credentials) return null;
  const app = getApps()[0] || initializeApp({ credential: cert(credentials) });
  return { db: getFirestore(app), auth: getAuth(app) };
};
