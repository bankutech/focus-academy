import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  createAdminUserWithEmail,
  sendAdminPasswordReset,
  isFirebaseConfigured, 
  isUserAdmin, 
  getAdminAllowlist 
} from '../../services/firebase';

export default function AdminLoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [resetEmail, setResetEmail] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin-portal';
  const hasFirebase = isFirebaseConfigured();
  const allowlist = getAdminAllowlist();

  const handleSuccessfulAuth = (user) => {
    const sessionData = JSON.stringify({
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      uid: user.uid || `local-${Date.now()}`
    });
    sessionStorage.setItem('focus_academy_admin_session', sessionData);
    if (rememberMe) {
      localStorage.setItem('focus_academy_admin_session', sessionData);
    } else {
      localStorage.removeItem('focus_academy_admin_session');
    }
    navigate(from, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
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
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your current domain';
        setError(`Domain not authorized: '${currentDomain}' is not in your Firebase Authentication Authorized Domains list. Please add '${currentDomain}' in Firebase Console (Authentication > Settings > Authorized domains) or sign in with your administrator email/password below.`);
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!isUserAdmin({ email: cleanEmail })) {
      setError(`Access Denied: Account '${cleanEmail}' is not on the Focus Academy administrator allowlist.`);
      return;
    }

    setLoading(true);
    try {
      if (hasFirebase) {
        const user = await createAdminUserWithEmail(cleanEmail, regPassword);
        handleSuccessfulAuth(user);
      } else {
        const user = {
          email: cleanEmail,
          displayName: `${firstName.trim()} ${lastName.trim()}`,
          uid: `admin-${cleanEmail.replace(/[^a-z0-9]/g, '')}`
        };
        handleSuccessfulAuth(user);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your administrator email address.');
      return;
    }

    setLoading(true);
    try {
      if (hasFirebase) {
        await sendAdminPasswordReset(cleanEmail);
        setSuccessMsg(`Password reset instructions sent to ${cleanEmail}. Check your inbox.`);
      } else {
        setSuccessMsg(`Password reset simulation: instructions dispatched for ${cleanEmail}.`);
      }
    } catch (err) {
      setError(err.message || 'Password reset request failed. Please check the email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (allowedEmail) => {
    setEmail(allowedEmail);
    setPassword('FocusCampus@2026');
    setMode('login');
  };

  return (
    <div className="w-full lg:w-[100vw] min-h-[100dvh] lg:h-[100dvh] flex flex-col lg:flex-row bg-[#0B1120] text-slate-100 overflow-x-hidden lg:overflow-hidden font-sans-body">
      {/* Left Hero Branding Panel */}
      <div className="w-full lg:w-1/2 relative lg:h-full shrink-0 flex flex-col justify-between overflow-hidden bg-[#0A0F1D] p-6 sm:p-8 lg:p-10 xl:p-14">
        <img 
          src="/campus-library.jpg" 
          alt="Focus Academy Educational Environment" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/75 to-[#0B1120]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/85 via-[#0F172A]/50 to-[#0F172A]/90" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center space-x-3 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded-lg">
              <img 
                src="/logo.png" 
                alt="Focus Academy Logo" 
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-xl bg-white p-1 shadow-lg border border-slate-700/60" 
              />
              <div className="flex flex-col text-left">
                <span className="text-white font-extrabold text-base sm:text-xl tracking-tight block leading-tight">
                  Focus Academy
                </span>
                <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider block">
                  Thoramangalam • Perambalur
                </span>
              </div>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors py-2 px-3.5 rounded-lg bg-slate-900/60 hover:bg-slate-900/90 backdrop-blur-xs border border-white/10 shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
            >
              <span>Back to website →</span>
            </Link>
          </div>

          <div className="mt-6 lg:mt-auto pt-4 lg:pt-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Learn Today. Lead Tomorrow.
            </h1>
            <p className="mt-2 lg:mt-3 text-sm sm:text-base xl:text-lg text-slate-300 leading-relaxed max-w-lg">
              A focused learning experience for every student's future.
            </p>
          </div>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div 
        data-testid="auth-right-panel"
        className="w-full lg:w-1/2 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 lg:py-2.5 2xl:py-6 overflow-y-auto bg-[#0B1120] relative"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        {/* Elevated Form Card */}
        <div className="w-full max-w-[460px] sm:max-w-[490px] lg:max-w-[500px] xl:max-w-[530px] 2xl:max-w-[560px] mx-auto relative z-10 bg-slate-900/75 sm:bg-slate-900/85 border border-slate-800/90 rounded-2xl p-5 sm:p-6 lg:p-6 2xl:p-8 shadow-2xl shadow-black/60 backdrop-blur-md flex flex-col justify-center">
          <div className="mb-3 sm:mb-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
              <span>Administrator Management Portal</span>
            </div>

            {mode === 'login' && (
              <>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm xl:text-base text-slate-400 mt-1">
                  Sign in to continue your learning journey.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[#EA580C] hover:text-orange-400 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    Create account
                  </button>
                </p>
              </>
            )}

            {mode === 'register' && (
              <>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white tracking-tight">
                  Create account
                </h2>
                <p className="text-xs sm:text-sm xl:text-base text-slate-400 mt-1">
                  Start your focused learning journey with us today.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[#EA580C] hover:text-orange-400 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}

            {mode === 'forgot' && (
              <>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white tracking-tight">
                  Reset password
                </h2>
                <p className="text-xs sm:text-sm xl:text-base text-slate-400 mt-1">
                  Enter your verified email to receive password reset instructions.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[#EA580C] hover:text-orange-400 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    ← Back to sign in
                  </button>
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-950/70 border border-red-500/50 rounded-xl flex items-start space-x-2 text-red-200 text-xs sm:text-sm leading-relaxed animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-start space-x-2 text-emerald-200 text-xs sm:text-sm leading-relaxed animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {!hasFirebase && mode === 'login' && (
            <div className="mb-3 px-3.5 py-2 bg-blue-950/40 border border-blue-500/30 rounded-xl text-blue-200 text-xs sm:text-sm leading-snug flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Local Sync Mode: Operating in verified campus state. Use allowlist below.</span>
            </div>
          )}

          {mode === 'login' && (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-3 sm:space-y-3.5">
                <div>
                  <label htmlFor="admin-email" className="block text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@focusacademyperambalur.com"
                      required
                      className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-colors shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-password" className="block text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 sm:pl-11 pr-11 py-2.5 sm:py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-colors shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Eye className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-700 bg-slate-900 text-[#EA580C] focus:ring-[#EA580C] focus:ring-offset-slate-900"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setResetEmail(email);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-orange-400 hover:text-orange-300 font-medium cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Sign in to Access Admin Console"
                  className="w-full py-2.5 sm:py-3.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-orange-950/40 transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                  <span className="sr-only">Access Admin Console</span>
                  <ArrowRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </button>
              </form>

              <div className="relative flex py-2 sm:py-2.5 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider">
                  or continue with
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 px-4 py-2.5 sm:py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold text-sm sm:text-base rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
              </button>
            </>
          )}

          {mode === 'register' && (
            <>
              <form onSubmit={handleRegisterSubmit} className="space-y-2 sm:space-y-2.5">
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  <div>
                    <label htmlFor="reg-first-name" className="block text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      First name
                    </label>
                    <input
                      id="reg-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Campus"
                      required
                      className="w-full px-3 py-1.5 sm:py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-colors shadow-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-last-name" className="block text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Last name
                    </label>
                    <input
                      id="reg-last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Admin"
                      required
                      className="w-full px-3 py-1.5 sm:py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-colors shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="coordinator@focusacademyperambalur.com"
                      required
                      className="w-full pl-10 pr-3 py-1.5 sm:py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-colors shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-1.5 sm:py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-colors shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    >
                      {showRegPassword ? <EyeOff className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Eye className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-0.5">
                  <label className="flex items-start space-x-2 text-xs sm:text-sm text-slate-300 cursor-pointer select-none">
                    <input
                      id="reg-terms"
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 rounded-sm border-slate-700 bg-slate-900 text-[#EA580C] focus:ring-[#EA580C] focus:ring-offset-slate-900"
                    />
                    <span className="leading-tight">
                      I agree to the{' '}
                      <Link to="/about" className="text-orange-400 hover:underline">
                        Terms & Conditions
                      </Link>{' '}
                      and Privacy Policy.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-950/30 transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Creating account...' : 'Create account'}</span>
                  <ArrowRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider">
                  or continue with
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 px-4 py-2 sm:py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>{loading ? 'Authenticating...' : 'Sign up with Google'}</span>
              </button>
            </>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label htmlFor="reset-email" className="block text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@focusacademyperambalur.com"
                    required
                    className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-colors shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-orange-950/30 transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Sending instructions...' : 'Send reset instructions'}</span>
                <ArrowRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            </form>
          )}

          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-slate-400">
              <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
                <span>Authorized Desks:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allowlist.slice(0, 3).map((allowed) => (
                  <button
                    key={allowed}
                    type="button"
                    onClick={() => handleQuickDemoLogin(allowed)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-900 hover:bg-orange-500/10 hover:text-orange-400 border border-slate-800 hover:border-orange-500/30 text-slate-300 transition-colors cursor-pointer"
                  >
                    {allowed.split('@')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
