import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut, 
  onAuthStateChanged,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'AIzaSyCHyFzVDHhXBzk9w9nDyzn_1Jj1krfknVM',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'focus-academy-7efeb.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'focus-academy-7efeb',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'focus-academy-7efeb.firebasestorage.app',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '272802842883',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '1:272802842883:web:8a509bf5b32d381b244136'
};

export const isFirebaseConfigured = () => {
  if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST)) {
    return false;
  }
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
  'coordinator@focusacademyperambalur.com',
  'sagnikmitra1302@gmail.com'
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
  if (user.emailVerified === false) return false;
  const allowlist = getAdminAllowlist();
  return allowlist.includes(email);
};

const applyPersistence = async (remember) => {
  if (!auth) return;
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
};

export const signInWithGoogle = async (remember = false) => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please supply valid VITE_FIREBASE_* credentials in your environment.');
  }
  await applyPersistence(remember);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signInWithEmail = async (email, password, remember = false) => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please supply valid VITE_FIREBASE_* credentials in your environment.');
  }
  await applyPersistence(remember);
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (!result.user.emailVerified) {
    await signOut(auth);
    const err = new Error('This email address is not verified yet. Open the verification link we emailed you, then sign in again.');
    err.code = 'auth/email-not-verified';
    throw err;
  }
  return result.user;
};

export const createAdminUserWithEmail = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please supply valid VITE_FIREBASE_* credentials in your environment.');
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  await signOut(auth);
  return { email: result.user.email, verificationSent: true };
};

export const resendAdminVerification = async (email, password) => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please supply valid VITE_FIREBASE_* credentials in your environment.');
  }
  const result = await signInWithEmailAndPassword(auth, email, password);
  try {
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
    }
  } finally {
    await signOut(auth);
  }
  return { alreadyVerified: result.user.emailVerified };
};

export const logOutAdmin = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export const sendAdminPasswordReset = async (email) => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please supply valid VITE_FIREBASE_* credentials in your environment.');
  }
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return;
    }
    throw err;
  }
};

export const extractPendingGoogleCredential = (error) => {
  if (!error) return null;
  try {
    return GoogleAuthProvider.credentialFromError(error);
  } catch {
    return null;
  }
};

export const resolveGoogleAccountConflictWithPassword = async (email, password, pendingCredential, remember = false) => {
  if (!auth) {
    throw new Error('Firebase Authentication is not configured.');
  }
  await applyPersistence(remember);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  if (!userCredential.user.emailVerified) {
    await signOut(auth);
    const err = new Error('This email address is not verified yet. Open the verification link we emailed you, then sign in again.');
    err.code = 'auth/email-not-verified';
    throw err;
  }
  if (pendingCredential) {
    try {
      await linkWithCredential(userCredential.user, pendingCredential);
    } catch (linkErr) {
      if (linkErr.code !== 'auth/credential-already-in-use' && linkErr.code !== 'auth/provider-already-linked') {
        console.warn('Account linking warning:', linkErr);
      }
    }
  }
  return userCredential.user;
};

export const linkGoogleToCurrentUser = async () => {
  if (!auth?.currentUser) {
    throw new Error('You must be signed in to link your Google account.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await linkWithPopup(auth.currentUser, provider);
  return result.user;
};

export const linkEmailPasswordToCurrentUser = async (password) => {
  if (!auth?.currentUser) {
    throw new Error('You must be signed in to add password credentials.');
  }
  const email = auth.currentUser.email;
  if (!email) {
    throw new Error('Current user does not have an email address.');
  }
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(auth.currentUser, credential);
  return result.user;
};

export const updateAdminPassword = async (newPassword) => {
  if (!auth?.currentUser) {
    throw new Error('You must be signed in to update your password.');
  }
  await updatePassword(auth.currentUser, newPassword);
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
    let claims = {};
    let isAdmin = false;
    try {
      const tokenResult = await user.getIdTokenResult();
      claims = tokenResult.claims || {};
      isAdmin = isUserAdmin(user, claims);
    } catch {
      isAdmin = isUserAdmin(user);
    }

    let avatarBase64 = null;
    let customDisplayName = null;
    let contactPhone = null;
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'admin_profiles', user.uid));
        if (snap && snap.exists()) {
          const data = snap.data();
          if (data.avatarBase64) avatarBase64 = data.avatarBase64;
          if (data.displayName) customDisplayName = data.displayName;
          if (data.phone) contactPhone = data.phone;
        }
      } catch {
        // Fallback safely if offline or permission denied
      }
    }

    callback({
      uid: user.uid,
      email: user.email,
      displayName: customDisplayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Administrator'),
      photoURL: user.photoURL || null,
      avatarBase64,
      contactPhone,
      isAdmin,
      claims
    });
  });
};
