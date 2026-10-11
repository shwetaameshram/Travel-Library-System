import React from 'react';
import { MapPin, Train, CheckCircle2 } from 'lucide-react';

export default function JourneyPath({ source, destination, className = '' }) {
  return (
    <div className={`glass-panel rounded-2xl p-4 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-purple-50/70 border-purple-200/60 ${className}`}>
      <div className="flex items-center justify-between gap-3 relative">
        {/* Source Station */}
        <div className="flex items-center gap-2 z-10 bg-white/90 px-3 py-1.5 rounded-xl shadow-sm border border-purple-100 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Origin</div>
            <div className="text-xs font-extrabold text-slate-900 line-clamp-1">{source || 'Source Station'}</div>
          </div>
        </div>

        {/* Dotted Route Line with Moving Train */}
        <div className="flex-1 flex items-center justify-center relative px-2 min-w-[60px]">
          <div className="w-full border-b-2 border-dashed border-purple-300"></div>
          <div className="absolute bg-white px-2 py-1 rounded-full shadow-md border border-purple-200 text-purple-600 animate-pulse">
            <Train className="w-4 h-4" />
          </div>
        </div>

        {/* Destination Station */}
        <div className="flex items-center gap-2 z-10 bg-white/90 px-3 py-1.5 rounded-xl shadow-sm border border-purple-100 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Return Target</div>
            <div className="text-xs font-extrabold text-slate-900 line-clamp-1">{destination || 'Destination Station'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
