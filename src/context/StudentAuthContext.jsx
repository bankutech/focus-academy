/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  auth,
  db,
  isFirebaseConfigured,
  getAdminAllowlist
} from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

const StudentAuthContext = createContext(null);

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) {
    return {
      user: null,
      profile: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isStudent: false,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      resetPassword: async () => {},
      updateProfile: async () => {},
      refreshProfile: async () => {},
      clearError: () => {},
    };
  }
  return ctx;
}

export function StudentAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const isAdmin = useCallback((email) => {
    if (!email) return false;
    const allowlist = getAdminAllowlist();
    return allowlist.includes(email.toLowerCase().trim());
  }, []);

  const loadProfile = useCallback(async (firebaseUser) => {
    if (!db || !firebaseUser) return null;
    try {
      const profileRef = doc(db, 'student_profiles', firebaseUser.uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (err) {
      console.warn('Failed to load student profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const demoRaw = typeof window !== 'undefined' ? localStorage.getItem('focus_demo_student') : null;
    if (demoRaw) {
      try {
        const demoStudent = JSON.parse(demoRaw);
        setUser({
          uid: demoStudent.id || 'demo-stu-1',
          email: demoStudent.email || 'kavitha.sundaram@focusacademy.in',
          displayName: demoStudent.studentName || 'Kavitha Sundaram',
          getIdToken: async () => 'demo-token-123'
        });
        setProfile(demoStudent);
        setLoading(false);
        return undefined;
      } catch {}
    }

    if (!isFirebaseConfigured() || !auth) {
      setLoading(false);
      return undefined;
    }

    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimer);
      if (!mountedRef.current) return;

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (isAdmin(firebaseUser.email)) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      const profileData = await loadProfile(firebaseUser);
      if (mountedRef.current) {
        setProfile(profileData);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [isAdmin, loadProfile]);

  const register = useCallback(async ({
    email, password, studentName, mobile, parentName, parentPhone, grade, board
  }) => {
    if (!auth || !db) {
      throw new Error('Firebase is not configured. Please contact the academy.');
    }
    setError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      // Set display name
      await updateProfile(firebaseUser, { displayName: studentName });

      // Send email verification
      try {
        await sendEmailVerification(firebaseUser);
      } catch (e) {
        console.warn('Email verification send failed:', e);
      }

      // Create student profile in Firestore
      const profileData = {
        uid: firebaseUser.uid,
        email: email.toLowerCase().trim(),
        studentName: studentName.trim(),
        mobile: mobile.trim(),
        parentName: (parentName || '').trim(),
        parentPhone: (parentPhone || '').trim(),
        grade: grade || 'Class 10',
        board: board || 'TN State Board (Samacheer)',
        role: 'student',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'student_profiles', firebaseUser.uid), profileData);

      if (mountedRef.current) {
        setUser(firebaseUser);
        setProfile({ id: firebaseUser.uid, ...profileData });
      }

      return { user: firebaseUser, profile: profileData };
    } catch (err) {
      const msg = friendlyError(err);
      if (mountedRef.current) setError(msg);
      throw new Error(msg);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    if (!auth) {
      throw new Error('Firebase is not configured. Please contact the academy.');
    }
    setError(null);

    // Block admin emails from student login
    if (isAdmin(email)) {
      const msg = 'This email is registered as an administrator. Please use the admin portal to sign in.';
      setError(msg);
      throw new Error(msg);
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      setUser(firebaseUser);
      const profileData = await loadProfile(firebaseUser);
      if (mountedRef.current) {
        setProfile(profileData);
      }

      return { user: firebaseUser, profile: profileData };
    } catch (err) {
      const msg = friendlyError(err);
      if (mountedRef.current) setError(msg);
      throw new Error(msg);
    }
  }, [isAdmin, loadProfile]);

  const logout = useCallback(async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } finally {
      if (mountedRef.current) {
        setUser(null);
        setProfile(null);
        setError(null);
      }
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!auth) {
      throw new Error('Firebase is not configured. Please contact the academy.');
    }
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Don't reveal if email exists
        return;
      }
      const msg = friendlyError(err);
      if (mountedRef.current) setError(msg);
      throw new Error(msg);
    }
  }, []);

  const updateStudentProfile = useCallback(async (updates) => {
    if (!user || !db) throw new Error('Not authenticated');
    const profileRef = doc(db, 'student_profiles', user.uid);
    const safeUpdates = { ...updates, updatedAt: serverTimestamp() };
    delete safeUpdates.uid;
    delete safeUpdates.email;
    delete safeUpdates.role;
    delete safeUpdates.createdAt;

    await updateDoc(profileRef, safeUpdates);
    if (mountedRef.current) {
      setProfile(prev => prev ? { ...prev, ...safeUpdates } : prev);
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profileData = await loadProfile(user);
    if (mountedRef.current) {
      setProfile(profileData);
    }
  }, [user, loadProfile]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated: Boolean(user),
    isStudent: Boolean(user) && !isAdmin(user?.email),
    login,
    register,
    logout,
    resetPassword,
    updateProfile: updateStudentProfile,
    refreshProfile,
    clearError,
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
}

function friendlyError(err) {
  const code = err?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in or use a different email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact the academy.';
    default:
      return err?.message || 'An unexpected error occurred. Please try again.';
  }
}
