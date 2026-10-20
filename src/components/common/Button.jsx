import React from 'react';
import { Link } from 'react-router-dom';

export default function Button({
  children,
  to,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  target,
  rel,
  ariaLabel,
  ...rest
}) {
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all cursor-pointer active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] disabled:opacity-50 disabled:pointer-events-none';

  const sizeClasses = {
    sm: 'px-3 py-1.5 rounded-md text-xs min-h-[36px]',
    md: 'px-5 py-2.5 rounded-md text-xs sm:text-sm min-h-[44px]',
    lg: 'px-7 py-3 rounded-md text-sm sm:text-base min-h-[48px]',
  }[size] || 'px-5 py-2.5 rounded-md text-xs sm:text-sm min-h-[44px]';

  const variantClasses = {
    primary: 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs',
    secondary: 'bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] shadow-xs',
    dark: 'bg-[#0F172A] hover:bg-slate-800 text-white shadow-xs',
    whatsapp: 'bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-xs focus-visible:ring-white',
    outline: 'bg-transparent hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0]',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-[#0F172A]',
  }[variant] || 'bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-xs';

  const combinedClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClasses} aria-label={ariaLabel} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={combinedClasses} aria-label={ariaLabel} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={combinedClasses}
      aria-label={ariaLabel}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
