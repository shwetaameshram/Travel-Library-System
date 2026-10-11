import React from 'react';

export default function SectionHeading({ badge, title, subtitle, align = 'center', className = '' }) {
  const alignment = align === 'left' ? 'text-left items-start' : align === 'right' ? 'text-right items-end' : 'text-center items-center';

  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-purple-100 text-[#6D28D9] border border-purple-200 shadow-xs mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9] animate-pulse"></span>
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-black text-[#24104F] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2.5 text-base md:text-lg text-[#4B5563] max-w-2xl font-medium leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
