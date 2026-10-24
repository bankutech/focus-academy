import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = () => {
  const key = firebaseConfig.apiKey;
  return Boolean(
    key && 
    typeof key === 'string' && 
    key.length > 10 && 
    !key.includes('placeholder') && 
    !key.includes('YOUR_') &&
    firebaseConfig.projectId
  );
};

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { app, auth, db };

const DEFAULT_ADMIN_ALLOWLIST = [
  'admin@focusacademyperambalur.com',
  'focusacademy.perambalur@gmail.com',
  'director@focusacademyperambalur.com',
  'principal@focusacademyperambalur.com',
  'coordinator@focusacademyperambalur.com'
];

export const getAdminAllowlist = () => {
  const envList = import.meta.env?.VITE_ADMIN_ALLOWLIST;
  if (envList && typeof envList === 'string') {
    const parsed = envList.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (parsed.length > 0) {
      return Array.from(new Set([...DEFAULT_ADMIN_ALLOWLIST, ...parsed]));
    }
  }
  return DEFAULT_ADMIN_ALLOWLIST;
};

export const isUserAdmin = (user, customClaims = {}) => {
  if (!user) return false;
  if (customClaims?.admin === true || customClaims?.role === 'admin') {
    return true;
  }
  const email = (user.email || '').trim().toLowerCase();
  if (!email) return false;
  const allowlist = getAdminAllowlist();
  return allowlist.includes(email);
};

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please supply valid VITE_FIREBASE_* credentials in your environment.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signInWithEmail = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please supply valid VITE_FIREBASE_* credentials in your environment.');
  }
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const createAdminUserWithEmail = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please supply valid VITE_FIREBASE_* credentials in your environment.');
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const logOutAdmin = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export const onAdminAuthStateChanged = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const tokenResult = await user.getIdTokenResult();
      const isAdmin = isUserAdmin(user, tokenResult.claims);
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        isAdmin,
        claims: tokenResult.claims
      });
    } catch {
      const isAdmin = isUserAdmin(user);
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        isAdmin,
        claims: {}
      });
    }
  });
};
