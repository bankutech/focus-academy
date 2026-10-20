import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) {
  const baseClasses = 'inline-flex items-center font-bold tracking-wide uppercase rounded-lg';

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs sm:text-sm',
  }[size] || 'px-2.5 py-1 text-xs';

  const variantClasses = {
    default: 'bg-[#0F172A] text-white',
    orange: 'bg-orange-50 text-[#EA580C] border border-orange-200',
    emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-900 border border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border border-[#E2E8F0]',
    white: 'bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xs',
  }[variant] || 'bg-[#0F172A] text-white';

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}
