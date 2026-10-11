import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, MapPin, ArrowRight, ShieldAlert, Sparkles, Filter, Layers } from 'lucide-react';
import { bookAPI } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import SectionHeading from '../components/ui/SectionHeading';
import StatusBadge from '../components/ui/StatusBadge';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookAPI.getAllBooks({
        title: searchTitle,
        author: searchAuthor,
        category: selectedCategory,
      });
      if (res.success) {
        setBooks(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to search books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [searchTitle, searchAuthor, selectedCategory]);

  const categories = ['Fiction', 'Non-Fiction', 'Biography', 'Self-Help', 'Classic', 'Dystopian', 'Fantasy', 'Finance', 'History'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <SectionHeading
        badge="Catalog Search"
        title="Travel Book Catalog"
        subtitle="Browse and reserve popular books available for pickup at station and airport libraries."
        align="left"
      />

      {/* Filter and Search Glass Bar */}
      <GlassCard className="border-purple-200 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#6D28D9]" />
            <input
              type="text"
              placeholder="Search by Title (e.g. Alchemist, Habits)..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-purple-200 text-[#24104F] placeholder-slate-400 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition-all font-bold"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#6D28D9]" />
            <input
              type="text"
              placeholder="Search by Author..."
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-purple-200 text-[#24104F] placeholder-slate-400 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition-all font-bold"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-purple-200 text-[#24104F] text-sm font-bold focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4">
          <Mascot type="main" size="md" float speech="Searching Library..." />
          <div className="flex items-center gap-2 text-sm font-bold text-[#6D28D9]">
            <div className="h-4 w-4 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />
            <span>Fetching Available Books...</span>
          </div>
        </div>
      ) : error ? (
        <GlassCard className="p-8 bg-rose-50 border-rose-200 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-rose-600 mx-auto" />
          <p className="text-rose-900 font-extrabold">{error}</p>
        </GlassCard>
      ) : books.length === 0 ? (
        /* Mascot Friendly Empty State */
        <GlassCard className="p-14 text-center space-y-6 border-purple-200">
          <Mascot type="empty" size="lg" speech="No books found!" float />
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-[#24104F]">No Books Match Your Search</h3>
            <p className="text-[#4B5563] text-sm max-w-md mx-auto font-medium">
              We couldn't find any books matching your criteria. Try clearing search filters or searching for another author or category.
            </p>
          </div>
          <div>
            <PrimaryButton
              variant="secondary"
              onClick={() => {
                setSearchTitle('');
                setSearchAuthor('');
                setSelectedCategory('');
              }}
            >
              Clear Search Filters
            </PrimaryButton>
          </div>
        </GlassCard>
      ) : (
        /* Books Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((b) => {
            const available = b.total_available_quantity > 0;
            return (
              <GlassCard hover key={b.id} className="flex flex-col justify-between border-purple-200 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-[#6D28D9] border border-purple-200">
                      {b.category}
                    </span>
                    <StatusBadge status={available ? 'available' : 'out_of_stock'} />
                  </div>

                  <h3 className="text-xl font-black text-[#24104F] group-hover:text-[#6D28D9] transition-colors leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-xs font-bold text-[#4B5563]">By {b.author}</p>

                  {/* Stock Availability */}
                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs">
                    <span className="text-[#4B5563] font-bold flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-[#6D28D9]" /> Total Stock:
                    </span>
                    <span className={`font-black ${available ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {available ? `${b.total_available_quantity} Copies Available` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Library Branches badges */}
                  {b.available_libraries && b.available_libraries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {b.available_libraries.slice(0, 3).map((lib, idx) => (
                        <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-white text-[#24104F] border border-purple-200 flex items-center gap-1 font-bold shadow-2xs">
                          <MapPin className="h-3 w-3 text-[#6D28D9] shrink-0" /> {lib.city} ({lib.available_quantity})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-purple-100">
                  <Link
                    to={`/books/${b.id}`}
                    className="py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#24104F] text-xs font-extrabold text-center border border-purple-200 transition-all shadow-2xs"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/rent?bookId=${b.id}`}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-extrabold text-center transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1"
                  >
                    <span>Rent Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
