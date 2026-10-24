import React from 'react';
import { ShieldAlert, LogOut, Home, Mail } from 'lucide-react';
import { logOutAdmin } from '../../services/firebase';

export default function AdminAccessDeniedPage({ user, onSignOut }) {
  const handleSignOut = async () => {
    try {
      await logOutAdmin();
      if (onSignOut) onSignOut();
      window.location.href = '/admin-portal/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-slate-200 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-red-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-[#0F172A] mb-2">
          Access Denied
        </h1>
        <p className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-4">
          Unauthorized Administrator Account
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Mail className="w-3.5 h-3.5" />
            <span>Signed In Account:</span>
          </div>
          <p className="text-sm font-bold text-[#0F172A] truncate">
            {user?.email || 'Unknown User'}
          </p>
        </div>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          This account is not on the Focus Academy administrator allowlist. Administrative privileges are not granted merely by signing in. Please sign in with an authorized Focus Academy administrator credential.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Account</span>
          </button>

          <a
            href="/"
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Campus Homepage</span>
          </a>
        </div>
      </div>
    </div>
  );
}
