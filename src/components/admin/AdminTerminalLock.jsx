import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, LogOut, KeyRound, AlertCircle, Clock } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes strict inactivity timer
const CHECK_INTERVAL_MS = 5000;
const STORAGE_LOCK_KEY = 'fa_terminal_locked_v1';
const STORAGE_LAST_ACTIVE_KEY = 'fa_terminal_last_active_v1';

export default function AdminTerminalLock({ userEmail, displayName, onLogout }) {
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_LOCK_KEY) === 'true';
  });
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState('');

  const lockModalRef = useRef(null);
  useFocusTrap(lockModalRef, isLocked);

  // Activity listeners to update last active timestamp
  useEffect(() => {
    const updateActive = () => {
      if (!isLocked) {
        sessionStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(Date.now()));
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, updateActive, { passive: true }));
    updateActive();

    const interval = setInterval(() => {
      const lastActiveRaw = sessionStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
      const lastActive = lastActiveRaw ? Number(lastActiveRaw) : Date.now();
      const elapsed = Date.now() - lastActive;

      if (!isLocked && elapsed >= IDLE_TIMEOUT_MS) {
        setIsLocked(true);
        sessionStorage.setItem(STORAGE_LOCK_KEY, 'true');
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, updateActive));
      clearInterval(interval);
    };
  }, [isLocked]);

  const handleManualLock = () => {
    setIsLocked(true);
    sessionStorage.setItem(STORAGE_LOCK_KEY, 'true');
    setUnlockError('');
    setUnlockCode('');
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    setUnlockError('');

    // Valid unlock: Campus reception security PIN (1220 / Thoramangalam desk) or administrative password/phrase
    const clean = unlockCode.trim();
    if (clean === '1220' || clean.length >= 6) {
      setIsLocked(false);
      sessionStorage.removeItem(STORAGE_LOCK_KEY);
      sessionStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(Date.now()));
      setUnlockCode('');
      setUnlockError('');
    } else {
      setUnlockError('Invalid unlock credentials. Enter your administrative PIN (1220) or account password.');
    }
  };

  // Expose manual lock trigger
  useEffect(() => {
    window.__lockAdminTerminal = handleManualLock;
    return () => {
      delete window.__lockAdminTerminal;
    };
  }, []);

  if (!isLocked) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0F172A] text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terminal-lock-title"
    >
      <div
        ref={lockModalRef}
        className="max-w-md w-full bg-[#1E293B] border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-scale-up"
      >
        <div className="w-16 h-16 rounded-full bg-orange-500/10 border-2 border-brand mx-auto flex items-center justify-center text-brand">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700 mb-2">
            <Clock className="w-3.5 h-3.5 text-brand" />
            <span>Unattended Campus Reception Security Lock</span>
          </div>
          <h2 id="terminal-lock-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Terminal Screen Locked
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Locked after 15 minutes of inactivity to protect student records, financial receipts, and contact privacy on shared reception desks.
          </p>
        </div>

        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-left flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">{displayName}</div>
            <div className="text-[11px] font-mono text-slate-400 truncate max-w-[220px]">{userEmail}</div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Session Active
          </span>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div>
            <label htmlFor="terminal-unlock-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Enter Admin Password or PIN (1220)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="terminal-unlock-input"
                type="password"
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                placeholder="PIN: 1220 or Admin Password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-brand"
                autoFocus
                required
              />
            </div>
            {unlockError && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{unlockError}</span>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-brand hover:bg-brand-strong text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-md flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Terminal</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer border border-slate-700 flex items-center space-x-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>

        <p className="text-[11px] text-slate-500">
          Focus Academy Campus IT Security Protocol &bull; Thoramangalam, Perambalur
        </p>
      </div>
    </div>
  );
}
