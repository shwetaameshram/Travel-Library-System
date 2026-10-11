import React from 'react';

export default function Mascot({
  type = 'main',
  size = 'md',
  speech = null,
  className = '',
  float = true
}) {
  const images = {
    main: '/images/mascot/mascot_main.png',
    empty: '/images/mascot/mascot_empty.png',
    reading: '/images/mascot/mascot_main.png',
    success: '/images/mascot/mascot_main.png'
  };

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    xl: 'w-64 h-64'
  };

  return (
    <div className={`relative inline-flex flex-col items-center justify-center bg-transparent ${className}`}>
      {speech && (
        <div className="mb-2 px-3.5 py-1.5 glass-panel rounded-2xl text-xs font-black text-[#24104F] shadow-md border border-purple-200/80 animate-bounce relative z-10">
          {speech}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white/95 rotate-45 border-r border-b border-purple-200/80"></div>
        </div>
      )}
      <div className={`relative bg-transparent ${float ? 'animate-float' : ''}`}>
        <img
          src={images[type] || images.main}
          alt="TravelLib Mascot"
          className={`${sizes[size] || sizes.md} object-contain bg-transparent drop-shadow-md`}
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
        <div className="hidden items-center justify-center bg-transparent rounded-full p-4 text-indigo-600 text-3xl font-bold">
          🐱📚
        </div>
      </div>
    </div>
  );
}
