import React, { useState, useEffect } from 'react';

const ACADEMY_TIPS = [
  'Strict 1:12 teacher-student ratio for personal attention',
  'Evening batches 4:30 PM to 9:00 PM aligned with Four Roads buses',
  'Classes 6 to 12 • TN State Board & CBSE Academic Mastery',
  'Thiripura Complex, Thoramangalam • 1-Day Free Trial'
];

export default function LoadingScreen({ message = 'Loading academic portal...' }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % ACADEMY_TIPS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      role="status" 
      aria-live="polite" 
      className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="relative mb-6">
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#EA580C]/25 via-[#F97316]/15 to-transparent blur-lg animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-[#0F172A] border-2 border-slate-700/60 shadow-xl flex items-center justify-center">
          <div className="absolute -inset-1 border-2 border-transparent border-t-[#EA580C] rounded-2xl animate-spin" />
          <div className="relative flex items-center">
            <span className="font-extrabold text-white text-3xl tracking-tight">FA</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] ml-0.5 animate-ping" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-5 max-w-sm">
        <h2 className="text-xl font-extrabold text-[#0F172A] tracking-wider uppercase font-sans">
          Focus Academy
        </h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Thoramangalam • Perambalur
        </p>
      </div>

      <div className="w-64 sm:w-72 h-1.5 bg-slate-200/80 rounded-full overflow-hidden mb-4 relative shadow-inner">
        <div className="h-full bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#EA580C] w-1/2 rounded-full animate-loader-shimmer" />
      </div>

      <p className="text-xs font-semibold text-slate-600 mb-2">
        {message}
      </p>

      <div className="h-6 flex items-center justify-center">
        <span 
          key={tipIndex} 
          className="text-[11px] text-[#EA580C] font-semibold bg-orange-50/90 px-3 py-1 rounded-full border border-orange-200/70 transition-all duration-300"
        >
          {ACADEMY_TIPS[tipIndex]}
        </span>
      </div>
    </div>
  );
}
