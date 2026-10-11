import React from 'react';
import GlassCard from './GlassCard';
import { Building2, MapPin, BookOpen, Train } from 'lucide-react';

export default function LibraryCard({ library, className = '' }) {
  if (!library) return null;

  return (
    <GlassCard hover className={`flex flex-col justify-between border-purple-200 ${className}`}>
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-700 text-white flex items-center justify-center shadow-md">
            <Train className="w-6 h-6 text-white" />
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase bg-purple-100 text-[#6D28D9] border border-purple-200">
            {library.station_code || 'Railway Station'}
          </span>
        </div>

        <h3 className="text-xl font-black text-[#24104F] leading-tight mb-1">
          {library.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-[#4B5563] font-extrabold mb-3">
          <MapPin className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" />
          <span>{library.city || 'Central Junction'}</span>
        </div>

        {library.address && (
          <p className="text-xs text-[#4B5563] font-medium line-clamp-2 leading-relaxed mb-4">
            {library.address}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#6D28D9]" />
          <span className="text-xs font-black text-[#24104F]">
            {library.total_books || library.book_count || '50+'} Books Available
          </span>
        </div>
        <span className="text-xs font-black text-[#6D28D9]">
          Connected Node
        </span>
      </div>
    </GlassCard>
  );
}
