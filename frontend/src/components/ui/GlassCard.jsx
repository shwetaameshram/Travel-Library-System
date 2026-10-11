import React from 'react';

export default function GlassCard({ children, className = '', hover = false, variant = 'light', ...props }) {
  const hasCustomBg = className.includes('bg-');
  
  // Default light glass vs custom dark background handling
  const baseBg = hasCustomBg 
    ? '' 
    : variant === 'dark'
    ? 'bg-slate-900/90 text-white border-slate-800'
    : 'glass-panel text-[#24104F]';

  return (
    <div
      className={`rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl ${baseBg} ${
        hover ? 'glass-panel-hover cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
