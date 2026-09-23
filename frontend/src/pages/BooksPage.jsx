import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Search, MapPin, ArrowRight, ShieldAlert, Sparkles, Filter, Layers } from 'lucide-react';
import { bookAPI } from '../services/api';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const categories = ['Fiction', 'Non-Fiction', 'Biography', 'Self-Help', 'Classic', 'Dystopian', 'Fantasy'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Travel Book Catalog</h1>
        <p className="text-slate-400 text-sm">
          Browse and reserve popular books available for pickup at station and airport libraries.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Title (e.g. Alchemist, Wings)..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Author..."
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
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
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Searching Travel Libraries...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto" />
          <p className="text-white font-semibold">{error}</p>
        </div>
      ) : books.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Books Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            We couldn't find any books matching your search criteria. Try clearing filters or searching for another title.
          </p>
          <button
            onClick={() => {
              setSearchTitle('');
              setSearchAuthor('');
              setSelectedCategory('');
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Clear Search Filters
          </button>
        </div>
      ) : (
        /* Books Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {b.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ISBN: {b.isbn}</span>
                </div>

                <h3 className="text-xl font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                  {b.title}
                </h3>
                <p className="text-sm font-semibold text-slate-400">By {b.author}</p>

                {/* Availability Summary */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" /> Total Available:
                  </span>
                  <span className={`font-bold ${b.total_available_quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {b.total_available_quantity > 0 ? `${b.total_available_quantity} Copies` : 'Out of Stock'}
                  </span>
                </div>

                {/* Library Branches badges */}
                {b.available_libraries && b.available_libraries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {b.available_libraries.slice(0, 3).map((lib, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-indigo-400 shrink-0" /> {lib.city} ({lib.available_quantity})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <Link
                  to={`/books/${b.id}`}
                  className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold text-center transition-colors"
                >
                  View Details
                </Link>
                <Link
                  to={`/rent?bookId=${b.id}`}
                  className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1"
                >
                  Rent Now <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
