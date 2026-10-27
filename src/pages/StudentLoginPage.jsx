import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, GraduationCap } from 'lucide-react';
import { useStudentAuth } from '../context/StudentAuthContext';

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resetPassword, isAuthenticated, loading, error, clearError } = useStudentAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const emailRef = useRef(null);
  const from = location.state?.from?.pathname || '/student-dashboard';

  useEffect(() => {
    document.title = 'Student Login | Focus Academy';
  }, []);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, from, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      // Navigation handled by useEffect above
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    setLocalError('');
    setResetSubmitting(true);
    try {
      await resetPassword(resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setResetSubmitting(false);
    }
  };

  const displayError = localError || error;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-7 h-7 text-brand" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {resetMode ? 'Reset Password' : 'Student Login'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {resetMode
              ? 'Enter your email to receive a password reset link.'
              : 'Sign in to your Focus Academy student account'}
          </p>
        </div>

        {/* Error */}
        {displayError && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 animate-in fade-in" role="alert">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 font-medium leading-relaxed">{displayError}</p>
          </div>
        )}

        {/* Reset password form */}
        {resetMode ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-editorial p-6">
            {resetSent ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#0F172A]">Check Your Email</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">
                  If an account exists for <strong>{resetEmail}</strong>, a password reset link has been sent. Check your inbox and spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => { setResetMode(false); setResetSent(false); setLocalError(''); }}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@example.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  {resetSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setResetMode(false); setLocalError(''); }}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#0F172A] cursor-pointer"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Login form */
          <form onSubmit={handleLogin} className="bg-white rounded-xl border border-[#E2E8F0] shadow-editorial p-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={emailRef}
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
                  placeholder="student@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => { setResetMode(true); setResetEmail(email); setLocalError(''); }}
                className="text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-brand hover:bg-brand-strong text-white text-sm font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 pt-2">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-bold text-brand hover:underline">
                Create Account
              </Link>
            </p>
          </form>
        )}

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <Link to="/" className="block text-xs font-medium text-slate-500 hover:text-[#0F172A]">
            ← Back to Focus Academy
          </Link>
          <Link to="/admin-portal/login" className="block text-[11px] text-slate-400 hover:text-slate-600">
            Administrator login →
          </Link>
        </div>
      </div>
    </div>
  );
}
