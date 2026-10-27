import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { passwordStrength, passwordChecks } from './authHelpers';

const INPUT = 'w-full py-2 sm:py-2.5 lg:py-1.5 xl:py-2.5 bg-slate-900/90 border rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-transparent transition-colors shadow-xs disabled:opacity-60';
const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1';

export function TextField({ id, label, type = 'text', value, onChange, placeholder, autoComplete, icon: Icon, invalid, describedBy, disabled, inputRef, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />}
        <input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          required
          className={`${INPUT} ${Icon ? 'pl-10 sm:pl-11' : 'pl-3.5'} pr-4 ${invalid ? 'border-red-500/70' : 'border-slate-700/80'}`}
          {...rest}
        />
      </div>
    </div>
  );
}

export function EmailField(props) {
  return <TextField type="email" icon={Mail} autoComplete="username" spellCheck={false} autoCapitalize="none" {...props} />;
}

export function PasswordField({ id, label = 'Password', value, onChange, placeholder = '••••••••••••', autoComplete, invalid, disabled, meter, onCapsChange, capsOn }) {
  const [visible, setVisible] = useState(false);
  const strength = meter ? passwordStrength(value) : null;
  const checks = meter ? passwordChecks(value) : null;
  const bars = ['bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-400'];

  return (
    <div>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="relative">
        <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) => onCapsChange && onCapsChange(e.getModifierState && e.getModifierState('CapsLock'))}
          onBlur={() => onCapsChange && onCapsChange(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-hint`}
          disabled={disabled}
          required
          className={`${INPUT} pl-10 sm:pl-11 pr-11 ${invalid ? 'border-red-500/70' : 'border-slate-700/80'}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-2 rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
        >
          {visible ? <EyeOff className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Eye className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
        </button>
      </div>
      <div id={`${id}-hint`} className="min-h-0">
        {capsOn && <p className="mt-1.5 text-xs font-semibold text-amber-300" role="status">Caps Lock is on</p>}
        {meter && value && (
          <div className="mt-2">
            <div className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${strength.score > i ? bars[strength.score] : 'bg-slate-700'}`} />
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{strength.label}</span>
              {!strength.acceptable && (
                <span> · needs {[!checks.length && '10+ characters', !checks.letter && 'a letter', !checks.number && 'a number'].filter(Boolean).join(', ') || 'one more mix of cases or symbols'}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText, disabled, className = '' }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`w-full py-2 sm:py-2.5 lg:py-1.5 xl:py-2.5 px-4 bg-brand hover:bg-brand-strong text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-orange-950/40 transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-brand ${className}`}
    >
      {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" aria-hidden="true" /> : null}
      <span>{loading ? loadingText : children}</span>
      {!loading && <ArrowRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" aria-hidden="true" />}
    </button>
  );
}

export function GoogleButton({ onClick, disabled, loading, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center space-x-3 px-4 py-2 sm:py-2.5 lg:py-1.5 xl:py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold text-sm sm:text-base rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
    >
      <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{loading ? 'Waiting for Google...' : children}</span>
    </button>
  );
}

export function Divider() {
  return (
    <div className="relative flex py-1.5 sm:py-2 lg:py-1 xl:py-2 items-center" role="separator">
      <div className="flex-grow border-t border-slate-800" />
      <span className="flex-shrink mx-3 text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider">or continue with</span>
      <div className="flex-grow border-t border-slate-800" />
    </div>
  );
}
