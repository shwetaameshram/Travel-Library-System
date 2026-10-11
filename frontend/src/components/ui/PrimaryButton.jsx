import React from 'react';

export default function PrimaryButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:-translate-y-0.5',
    secondary: 'glass-panel text-slate-800 hover:bg-white/90 border-purple-200/80 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5',
    outline: 'border-2 border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white hover:shadow-md'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
