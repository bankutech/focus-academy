import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAdminAuthStateChanged, isFirebaseConfigured, logOutAdmin } from '../../services/firebase';
import { setVerifiedAdmin } from '../../services/adminIdentity';
import AdminAccessDeniedPage from './AdminAccessDeniedPage';

export default function AdminProtectedRoute({ children }) {
  const [authState, setAuthState] = useState({
    loading: true,
    user: null,
    isAdmin: false
  });
  const location = useLocation();

  useEffect(() => {
    const demoAdminRaw = typeof window !== 'undefined' ? localStorage.getItem('focus_demo_admin') : null;
    if (demoAdminRaw) {
      try {
        const demoAdmin = JSON.parse(demoAdminRaw);
        setVerifiedAdmin(demoAdmin);
        setAuthState({ loading: false, user: demoAdmin, isAdmin: true });
        return undefined;
      } catch {}
    }

    if (!isFirebaseConfigured()) {
      setVerifiedAdmin(null);
      setAuthState({ loading: false, user: null, isAdmin: false });
      return undefined;
    }
    const safetyTimer = setTimeout(() => {
      setAuthState((prev) => (prev.loading ? { loading: false, user: null, isAdmin: false } : prev));
    }, 1200);

    const unsubscribe = onAdminAuthStateChanged((userProfile) => {
      clearTimeout(safetyTimer);
      if (!userProfile) {
        setVerifiedAdmin(null);
        setAuthState({ loading: false, user: null, isAdmin: false });
        return;
      }
      const isAdmin = Boolean(userProfile.isAdmin);
      setVerifiedAdmin(isAdmin ? userProfile : null);
      setAuthState({ loading: false, user: userProfile, isAdmin });
    });
    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Verifying Focus Academy Security Credentials...
        </p>
      </div>
    );
  }

  if (!authState.user) {
    return <Navigate to="/admin-portal/login" state={{ from: location }} replace />;
  }

  if (!authState.isAdmin) {
    return (
      <AdminAccessDeniedPage 
        user={authState.user} 
        onSignOut={async () => {
          try {
            await logOutAdmin();
          } finally {
            setVerifiedAdmin(null);
            setAuthState({ loading: false, user: null, isAdmin: false });
          }
        }} 
      />
    );
  }

  return children;
}
