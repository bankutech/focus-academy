import React, { useState, useEffect } from 'react';

export default function LoadingScreen({ 
  message = 'Loading academic portal...', 
  initialMode = false,
  onComplete 
}) {
  const [progress, setProgress] = useState(initialMode ? 8 : 100);

  useEffect(() => {
    if (!initialMode) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 100;
        }
        const increment = Math.max(1, Math.floor(Math.random() * 4) + 1);
        return Math.min(100, prev + increment);
      });
    }, 35);

    return () => clearInterval(interval);
  }, [initialMode, onComplete]);

  return (
    <div 
      role="status" 
      aria-live="polite" 
      className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand-bright/25 via-[#F97316]/15 to-transparent blur-xl animate-pulse" />
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0F172A] border-2 border-slate-700/60 shadow-2xl flex items-center justify-center">
          <div className="absolute -inset-1.5 border-2 border-transparent border-t-brand border-r-[#F97316]/50 rounded-2xl animate-spin" />
          <div className="relative flex items-center">
            <span className="font-extrabold text-white text-3xl sm:text-4xl tracking-tight">FA</span>
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-brand ml-1 animate-ping" />
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-5 max-w-sm">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-wider uppercase font-sans">
          Focus Academy
        </h2>
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
          Thoramangalam • Perambalur
        </p>
      </div>

      <div className="w-64 sm:w-80">
        <div className="flex items-center justify-between text-xs mb-1.5 px-0.5">
          <span className="text-[11px] font-semibold text-slate-500">
            {message}
          </span>
          {initialMode && (
            <span className="text-xs font-extrabold text-brand tabular-nums">
              {progress}%
            </span>
          )}
        </div>

        <div className="h-2 bg-slate-200/90 rounded-full overflow-hidden relative shadow-inner p-0.5">
          {initialMode ? (
            <div 
              className="h-full bg-gradient-to-r from-brand via-[#F97316] to-brand rounded-full transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          ) : (
            <div className="h-full bg-gradient-to-r from-brand via-[#F97316] to-brand w-1/2 rounded-full animate-loader-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
}
