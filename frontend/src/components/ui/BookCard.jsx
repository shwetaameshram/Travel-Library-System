import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from './GlassCard';
import StatusBadge from './StatusBadge';
import { BookOpen, ArrowRight } from 'lucide-react';
import { getBookCover, DEFAULT_BOOK_COVER } from '../../utils/bookCovers';

export default function BookCard({ book, className = '' }) {
  if (!book) return null;

  const available = book.available_quantity !== undefined ? book.available_quantity > 0 : true;
  const coverSrc = getBookCover(book);

  return (
    <GlassCard hover className={`flex flex-col h-full border-purple-200 group transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Book Cover Container (Portrait 2/3 Ratio) */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden mb-4 shadow-md bg-purple-50">
        <img
          src={coverSrc}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          onError={(e) => {
            if (e.target.src !== DEFAULT_BOOK_COVER) {
              e.target.src = DEFAULT_BOOK_COVER;
            }
          }}
        />

        {/* Category Badge Overlay */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/90 text-[#6D28D9] border border-purple-200/80 backdrop-blur-md shadow-xs">
            {book.category || 'Travel Book'}
          </span>
        </div>

        {/* Availability Badge Overlay */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={available ? 'available' : 'out_of_stock'} />
        </div>
      </div>

      {/* Book Info */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-lg font-black text-[#24104F] line-clamp-1 mt-0.5 group-hover:text-[#6D28D9] transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-[#4B5563] font-bold line-clamp-1 mb-3">
            by {book.author || 'Unknown Author'}
          </p>
        </div>

        {/* Deposit & Fee Summary */}
        <div className="pt-3 border-t border-purple-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#6B7280] font-bold block">Refundable Deposit</span>
            <span className="text-base font-black text-[#24104F]">
              ₹{Number(book.book_value || 500).toLocaleString('en-IN')}
            </span>
          </div>
          <Link
            to={`/books/${book.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>View Book</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
