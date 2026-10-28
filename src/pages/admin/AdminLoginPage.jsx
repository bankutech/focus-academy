import { usePageMeta } from '../../hooks/usePageMeta';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, CheckCircle2, Info, WifiOff, User } from 'lucide-react';
import {
  signInWithGoogle,
  logOutAdmin,
  signInWithEmail,
  createAdminUserWithEmail,
  resendAdminVerification,
  sendAdminPasswordReset,
  onAdminAuthStateChanged,
  isFirebaseConfigured,
  isUserAdmin
} from '../../services/firebase';
import { EmailField, PasswordField, TextField, SubmitButton, GoogleButton, Divider } from './AuthFields';
import { friendlyAuthError, passwordStrength, readLock, recordFailure, clearFailures } from './authHelpers';

const NO_ACCESS = 'This account is not set up for administrator access. Ask the academy owner to add you.';
const INVITE_ONLY = 'Registration is limited to invited administrators. Ask the academy owner to add your email first.';
const RESET_NOTICE = (address) => `If an administrator account exists for ${address}, a reset link is on its way. Check your inbox and spam folder.`;
const RESET_COOLDOWN_MS = 30000;

const TITLES = {
  login: ['Administrator sign in', 'Use your academy staff email and password.'],
  register: ['Create administrator account', 'Registration is limited to emails the academy owner has approved.'],
  forgot: ['Reset password', 'Enter your administrator email to receive reset instructions.'],
};

export default function AdminLoginPage() {
  usePageMeta({
    path: '/admin-portal/login',
    robots: 'noindex,nofollow',
  });
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [capsOn, setCapsOn] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetUntil, setResetUntil] = useState(0);

  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockUntil, setLockUntil] = useState(() => readLock().until);
  const [now, setNow] = useState(() => Date.now());
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const navigate = useNavigate();
  const location = useLocation();
  const errorRef = useRef(null);
  const firstFieldRef = useRef(null);
  const mountedRef = useRef(false);

  const from = location.state?.from?.pathname || '/admin-portal';
  const hasFirebase = isFirebaseConfigured();
  const lockSeconds = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const locked = lockSeconds > 0;
  const resetSeconds = Math.max(0, Math.ceil((resetUntil - now) / 1000));

  useEffect(() => {
    document.title = 'Administrator Sign in | Focus Academy';
  }, []);

  useEffect(() => {
    if (!hasFirebase) return undefined;
    return onAdminAuthStateChanged((profile) => {
      if (profile?.isAdmin) navigate(from, { replace: true });
    });
  }, [hasFirebase, from, navigate]);

  useEffect(() => {
    if (!locked && resetSeconds === 0) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [locked, resetSeconds]);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus();
  }, [error]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (firstFieldRef.current) firstFieldRef.current.focus();
  }, [mode]);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setErrorCode('');
    setSuccessMsg('');
    setCapsOn(false);
    if (next === 'forgot') setResetEmail(email);
  };

  const fail = (message, code = '') => {
    setError(message);
    setErrorCode(code);
  };

  const failedAttempt = (err) => {
    if (err?.code === 'auth/network-request-failed' || err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/email-not-verified') return;
    const next = recordFailure();
    setNow(Date.now());
    setLockUntil(next.until);
  };

  const begin = () => {
    setError('');
    setErrorCode('');
    setSuccessMsg('');
    setLoading(true);
  };

  const finishSignIn = async (user) => {
    if (!isUserAdmin(user)) {
      await logOutAdmin();
      fail(NO_ACCESS);
      return;
    }
    clearFailures();
    navigate(from, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    if (!hasFirebase) return fail('Sign-in is not configured on this deployment.');
    begin();
    try {
      const user = await signInWithGoogle(rememberMe);
      await finishSignIn(user);
    } catch (err) {
      failedAttempt(err);
      fail(friendlyAuthError(err), err?.code);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (locked) return fail(`Too many attempts. Try again in ${lockSeconds}s.`);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return fail('Enter your email address and password.');
    if (!hasFirebase) return fail('Sign-in is not configured on this deployment.');
    begin();
    try {
      const user = await signInWithEmail(cleanEmail, password, rememberMe);
      await finishSignIn(user);
    } catch (err) {
      failedAttempt(err);
      fail(friendlyAuthError(err), err?.code);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return fail('Enter your email and password above, then request a new link.', 'auth/email-not-verified');
    begin();
    try {
      await resendAdminVerification(cleanEmail, password);
      setSuccessMsg(`A new verification link is on its way to ${cleanEmail}.`);
    } catch (err) {
      fail(friendlyAuthError(err), err?.code);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!firstName.trim() || !lastName.trim()) return fail('Enter your first and last name.');
    if (!cleanEmail) return fail('Enter your email address.');
    if (!passwordStrength(regPassword).acceptable) return fail('Choose a stronger password: at least 10 characters with a letter and a number.');
    if (!acceptTerms) return fail('Please accept the Terms and Privacy Policy to continue.');
    if (!isUserAdmin({ email: cleanEmail })) return fail(INVITE_ONLY);
    if (!hasFirebase) return fail('Sign-in is not configured on this deployment.');
    begin();
    try {
      await createAdminUserWithEmail(cleanEmail, regPassword);
      setMode('login');
      setEmail(cleanEmail);
      setPassword('');
      setRegPassword('');
      setSuccessMsg(`Verification link sent to ${cleanEmail}. Open it, then sign in.`);
    } catch (err) {
      fail(friendlyAuthError(err), err?.code);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) return fail('Enter your administrator email address.');
    if (resetSeconds > 0) return fail(`Please wait ${resetSeconds}s before requesting another link.`);
    if (!hasFirebase) return fail('Sign-in is not configured on this deployment.');
    begin();
    try {
      await sendAdminPasswordReset(cleanEmail);
      setSuccessMsg(RESET_NOTICE(cleanEmail));
      setResetUntil(Date.now() + RESET_COOLDOWN_MS);
      setNow(Date.now());
    } catch (err) {
      if (err?.code === 'auth/invalid-email' || err?.code === 'auth/network-request-failed' || err?.code === 'auth/too-many-requests') {
        fail(friendlyAuthError(err), err.code);
      } else {
        setSuccessMsg(RESET_NOTICE(cleanEmail));
        setResetUntil(Date.now() + RESET_COOLDOWN_MS);
        setNow(Date.now());
      }
    } finally {
      setLoading(false);
    }
  };

  const [heading, subheading] = TITLES[mode];
  const linkBtn = 'text-[#EA580C] hover:text-orange-400 font-semibold cursor-pointer underline underline-offset-2 rounded-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]';

  return (
    <div className="w-full lg:w-[100vw] min-h-[100dvh] lg:h-[100dvh] flex flex-col lg:flex-row bg-[#0B1120] text-slate-100 overflow-x-hidden lg:overflow-hidden font-sans-body">
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
                src="/logo-80.png"
                alt="Focus Academy logo"
                width="80"
                height="80"
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
              Administrator access only.
            </h1>
            <p className="mt-2 lg:mt-3 text-sm sm:text-base xl:text-lg text-slate-300 leading-relaxed max-w-lg">
              Sign in with your academy staff account to review admission enquiries, batch capacity, fee ledgers and audit records.
            </p>
          </div>
        </div>
      </div>

      <div 
        data-testid="auth-right-panel"
        className="w-full lg:w-1/2 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-4 lg:py-1 2xl:py-6 overflow-y-auto bg-[#0B1120] relative"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <main className="w-full max-w-[460px] sm:max-w-[490px] lg:max-w-[500px] xl:max-w-[530px] 2xl:max-w-[560px] mx-auto relative z-10 bg-slate-900/75 sm:bg-slate-900/85 border border-slate-800/90 rounded-2xl p-5 sm:p-6 lg:py-2.5 lg:px-6 xl:p-6 2xl:p-8 shadow-2xl shadow-black/60 backdrop-blur-md flex flex-col justify-center">
          <div className="mb-2 sm:mb-4">
            <div className="inline-flex items-center space-x-2 px-3 py-0.5 sm:py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm font-bold text-orange-400 uppercase tracking-wider mb-1.5 sm:mb-2">
              <ShieldCheck className="w-4 h-4 text-[#EA580C]" aria-hidden="true" />
              <span>Administrator Management Portal</span>
            </div>

            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white tracking-tight">{heading}</h2>
            <p className="text-xs sm:text-sm xl:text-base text-slate-400 mt-0.5 sm:mt-1">{subheading}</p>

            {mode === 'login' && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('register')} className={linkBtn}>Create account</button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className={linkBtn}>Sign in</button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                <button type="button" onClick={() => switchMode('login')} className={linkBtn}>← Back to sign in</button>
              </p>
            )}
          </div>

          {!online && (
            <div role="status" className="mb-3 px-3.5 py-2 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs sm:text-sm flex items-center space-x-2">
              <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>You are offline. Sign-in will work again once you reconnect.</span>
            </div>
          )}

          {!hasFirebase && (
            <div role="status" className="mb-3 px-3.5 py-2 bg-blue-950/40 border border-blue-500/30 rounded-xl text-blue-200 text-xs sm:text-sm leading-snug flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
              <span>Sign-in is not configured on this deployment, so the console cannot be opened.</span>
            </div>
          )}

          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="mb-3 p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs sm:text-sm leading-relaxed outline-hidden focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
              {errorCode === 'auth/email-not-verified' && (
                <button type="button" onClick={handleResendVerification} disabled={loading} className="mt-2 ml-6 sm:ml-7 text-red-100 font-semibold underline underline-offset-2 cursor-pointer disabled:opacity-50">
                  Send a new verification link
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div role="status" className="mb-3 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl flex items-start space-x-2 text-emerald-200 text-xs sm:text-sm leading-relaxed">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-3 sm:space-y-3.5" aria-label="Administrator sign in">
                <EmailField id="admin-email" label="Email address" value={email} onChange={setEmail} placeholder="you@focusacademyperambalur.com" inputRef={firstFieldRef} disabled={loading} invalid={Boolean(error) && !password} />
                <PasswordField id="admin-password" value={password} onChange={setPassword} autoComplete="current-password" disabled={loading} capsOn={capsOn} onCapsChange={setCapsOn} invalid={Boolean(error) && Boolean(password)} />

                <div className="flex items-center justify-between gap-3 text-xs sm:text-sm pt-0.5">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-700 bg-slate-900 text-[#EA580C] focus:ring-[#EA580C] focus:ring-offset-slate-900"
                    />
                    <span>Keep me signed in <span className="text-slate-400">(not on shared computers)</span></span>
                  </label>
                  <button type="button" onClick={() => switchMode('forgot')} className="text-orange-400 hover:text-orange-300 font-medium cursor-pointer transition-colors whitespace-nowrap rounded-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]">
                    Forgot password?
                  </button>
                </div>

                <SubmitButton loading={loading} loadingText="Signing in..." disabled={locked}>
                  {locked ? `Try again in ${lockSeconds}s` : 'Sign in'}
                </SubmitButton>
              </form>

              <Divider />
              <GoogleButton onClick={handleGoogleSignIn} disabled={loading || !online} loading={loading}>Sign in with Google</GoogleButton>
            </>
          )}

          {mode === 'register' && (
            <>
              <form onSubmit={handleRegisterSubmit} className="space-y-2 sm:space-y-3 lg:space-y-1.5 xl:space-y-2.5" aria-label="Create administrator account">
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  <TextField id="reg-first-name" label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" icon={User} inputRef={firstFieldRef} disabled={loading} />
                  <TextField id="reg-last-name" label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" disabled={loading} />
                </div>
                <EmailField id="reg-email" label="Email address" value={regEmail} onChange={setRegEmail} autoComplete="email" placeholder="you@focusacademyperambalur.com" disabled={loading} />
                <PasswordField id="reg-password" value={regPassword} onChange={setRegPassword} autoComplete="new-password" disabled={loading} meter capsOn={capsOn} onCapsChange={setCapsOn} />

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
                    <Link to="/about" className="text-orange-400 hover:underline">Terms & Conditions</Link>{' '}
                    and Privacy Policy.
                  </span>
                </label>

                <SubmitButton loading={loading} loadingText="Creating account...">Create account</SubmitButton>
              </form>

              <Divider />
              <GoogleButton onClick={handleGoogleSignIn} disabled={loading || !online} loading={loading}>Sign up with Google</GoogleButton>
            </>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleResetSubmit} className="space-y-3" aria-label="Reset password">
              <EmailField id="reset-email" label="Email address" value={resetEmail} onChange={setResetEmail} placeholder="you@focusacademyperambalur.com" inputRef={firstFieldRef} disabled={loading} />
              <SubmitButton loading={loading} loadingText="Sending instructions..." disabled={resetSeconds > 0}>
                {resetSeconds > 0 ? `Send again in ${resetSeconds}s` : 'Send reset instructions'}
              </SubmitButton>
            </form>
          )}

          <div className="mt-3.5 pt-3 lg:mt-2.5 lg:pt-2 border-t border-slate-800/80">
            <p className="flex items-start gap-2 text-xs sm:text-sm text-slate-400 leading-snug">
              <ShieldCheck className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" aria-hidden="true" />
              <span>Authorized staff only. The academy will never ask you for your password by phone, email or WhatsApp.</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
