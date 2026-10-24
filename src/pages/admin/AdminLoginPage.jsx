import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Info, Sparkles } from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  isFirebaseConfigured, 
  isUserAdmin, 
  getAdminAllowlist 
} from '../../services/firebase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin-portal';
  const hasFirebase = isFirebaseConfigured();
  const allowlist = getAdminAllowlist();

  const handleSuccessfulAuth = (user) => {
    sessionStorage.setItem('focus_academy_admin_session', JSON.stringify({
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      uid: user.uid || `local-${Date.now()}`
    }));
    navigate(from, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      if (hasFirebase) {
        const user = await signInWithGoogle();
        if (!isUserAdmin(user)) {
          setError(`Access Denied: Account '${user.email}' is not on the Focus Academy administrator allowlist.`);
          setLoading(false);
          return;
        }
        handleSuccessfulAuth(user);
      } else {
        const demoUser = {
          email: 'admin@focusacademyperambalur.com',
          displayName: 'Campus Administrator',
          uid: 'admin-fa-001'
        };
        handleSuccessfulAuth(demoUser);
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setError('Please enter your administrator password.');
      return;
    }

    if (!isUserAdmin({ email: cleanEmail })) {
      setError(`Access Denied: Account '${cleanEmail}' is not on the Focus Academy administrator allowlist.`);
      return;
    }

    setLoading(true);
    try {
      if (hasFirebase) {
        const user = await signInWithEmail(cleanEmail, password);
        handleSuccessfulAuth(user);
      } else {
        const user = {
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0].toUpperCase(),
          uid: `admin-${cleanEmail.replace(/[^a-z0-9]/g, '')}`
        };
        handleSuccessfulAuth(user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (allowedEmail) => {
    setEmail(allowedEmail);
    setPassword('FocusCampus@2026');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/logo.png" 
            alt="Focus Academy Logo" 
            className="w-16 h-16 object-contain rounded-xl shadow-lg border border-slate-700 bg-white p-1" 
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Focus Academy
        </h2>
        <p className="mt-1 text-sm font-semibold text-orange-400">
          Administrator Management Portal
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Thiripura Complex, Thoramangalam, Perambalur
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-5 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
            <span>Secure Administrative Authentication</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start space-x-3 text-red-700 text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!hasFirebase && (
            <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs leading-snug flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Local Sync & Verification Mode:</span>
                <p className="mt-0.5 text-blue-800">
                  Operating in self-contained campus state. Select an allowlisted administrator below or enter your authorized email.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-lg shadow-xs transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Authenticating...' : 'Sign In with Authorized Google'}</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase font-bold tracking-wider">or sign in with credentials</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Administrator Email
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@focusacademyperambalur.com"
                    required
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Password
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs sm:text-sm rounded-lg shadow-md transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Access Admin Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Authorized Campus Administrator Allowlist:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allowlist.slice(0, 3).map((allowed) => (
                  <button
                    key={allowed}
                    type="button"
                    onClick={() => handleQuickDemoLogin(allowed)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-[#EA580C] hover:border-orange-200 border border-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                  >
                    {allowed}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Return to Public Focus Academy Website
          </a>
        </div>
      </div>
    </div>
  );
}
