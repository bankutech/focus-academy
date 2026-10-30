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
      <div className="relative mb-5">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#0F172A] border border-slate-700 shadow-sm flex items-center justify-center">
          <span className="font-extrabold text-white text-2xl sm:text-3xl tracking-tight">FA</span>
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
