import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { BookmarkPlus, MapPin, Calendar, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Train, Plane, BookOpen, ShieldCheck } from 'lucide-react';
import { bookAPI, libraryAPI, connectionAPI, rentalAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RentalPage() {
  const [searchParams] = useSearchParams();
  const bookIdFromUrl = searchParams.get('book_id');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [books, setBooks] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [connections, setConnections] = useState([]);

  const [selectedBookId, setSelectedBookId] = useState(bookIdFromUrl || '');
  const [selectedBook, setSelectedBook] = useState(null);
  const [sourceLibraryId, setSourceLibraryId] = useState('');
  const [destinationLibraryId, setDestinationLibraryId] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rentalConfirmation, setRentalConfirmation] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [booksRes, libsRes, connRes] = await Promise.all([
          bookAPI.getAllBooks(),
          libraryAPI.getAllLibraries(),
          connectionAPI.getAllConnections()
        ]);

        const allBooks = booksRes.data || [];
        setBooks(allBooks);
        setLibraries(libsRes.data || []);
        setConnections(connRes.data || []);

        if (bookIdFromUrl) {
          const match = allBooks.find((b) => Number(b.id) === Number(bookIdFromUrl));
          if (match) setSelectedBook(match);
        }
      } catch (err) {
        setError(err.message || 'Failed to load rental booking options.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isAuthenticated, bookIdFromUrl, navigate]);

  // Update selected book object whenever dropdown changes
  const handleBookChange = async (e) => {
    const bId = e.target.value;
    setSelectedBookId(bId);
    if (!bId) {
      setSelectedBook(null);
      return;
    }
    const match = books.find((b) => Number(b.id) === Number(bId));
    if (match) {
      setSelectedBook(match);
    } else {
      try {
        const res = await bookAPI.getBookById(bId);
        setSelectedBook(res.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Filter available destination libraries based on selected source library
  const availableDestinationLibraries = libraries.filter((lib) => {
    if (!sourceLibraryId) return false;
    if (Number(lib.id) === Number(sourceLibraryId)) return false;
    return connections.some(
      (conn) =>
        Number(conn.source_library_id) === Number(sourceLibraryId) &&
        Number(conn.destination_library_id) === Number(lib.id)
    );
  });

  const handleSourceLibraryChange = (e) => {
    const srcId = e.target.value;
    setSourceLibraryId(srcId);
    setDestinationLibraryId('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedBookId || !sourceLibraryId || !destinationLibraryId) {
      setError('Please select a book, source library, and destination library.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await rentalAPI.createRental({
        user_id: user.id,
        book_id: Number(selectedBookId),
        source_library_id: Number(sourceLibraryId),
        destination_library_id: Number(destinationLibraryId),
        due_date: dueDate
      });

      if (res.success && res.data) {
        setRentalConfirmation({
          ...res.data,
          book_title: selectedBook?.title || `Book #${selectedBookId}`,
          source_name: libraries.find((l) => Number(l.id) === Number(sourceLibraryId))?.name,
          destination_name: libraries.find((l) => Number(l.id) === Number(destinationLibraryId))?.name
        });
      } else {
        setError(res.message || 'Failed to process rental.');
      }
    } catch (err) {
      setError(err.message || 'Rental creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
        <span>Loading rental form options...</span>
      </div>
    );
  }

  // Render Confirmation View after successful rental
  if (rentalConfirmation) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Rental Confirmed!</h1>
            <p className="text-slate-400 text-sm">Your travel book reservation is ready for pickup</p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-sm">
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span className="text-slate-500">Rental Code / ID:</span>
              <span className="font-bold text-indigo-400">{rentalConfirmation.rental_code || `TL-${rentalConfirmation.id}`}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span className="text-slate-500">Book Title:</span>
              <span className="font-bold text-white">{rentalConfirmation.book_title}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span className="text-slate-500">Source Library (Pickup):</span>
              <span className="text-slate-200">{rentalConfirmation.source_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span className="text-slate-500">Destination Library (Return):</span>
              <span className="text-slate-200">{rentalConfirmation.destination_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span className="text-slate-500">Due Date:</span>
              <span className="text-amber-400">{new Date(rentalConfirmation.due_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
                {rentalConfirmation.status || 'RENTED'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard"
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center text-sm transition-all"
            >
              Go to My Dashboard
            </Link>
            <Link
              to="/books"
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-center text-sm transition-all border border-slate-700"
            >
              Browse More Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <BookmarkPlus className="h-7 w-7 text-indigo-400" /> Book Rental Booking
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Reserve a book at your departure library and select where you'll return it on arrival
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
        {/* Book Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select Book</label>
          <div className="relative">
            <BookOpen className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <select
              value={selectedBookId}
              onChange={handleBookChange}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              required
            >
              <option value="">-- Choose a Book --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (by {b.author}) - {b.total_available_quantity} available
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Book Overview Card */}
        {selectedBook && (
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-indigo-400 font-semibold">{selectedBook.category}</div>
              <div className="font-bold text-white text-base">{selectedBook.title}</div>
              <div className="text-xs text-slate-400">by {selectedBook.author}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> In Stock
              </span>
            </div>
          </div>
        )}

        {/* Source Library Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Source Library (Departure / Pickup Location)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <select
              value={sourceLibraryId}
              onChange={handleSourceLibraryChange}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
              required
            >
              <option value="">-- Choose Source Library --</option>
              {libraries.map((lib) => (
                <option key={lib.id} value={lib.id}>
                  {lib.name} ({lib.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination Library Selector (Dynamically Filtered) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Destination Library (Arrival / Return Location)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <select
              value={destinationLibraryId}
              onChange={(e) => setDestinationLibraryId(e.target.value)}
              disabled={!sourceLibraryId}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
              required
            >
              <option value="">
                {!sourceLibraryId ? '-- Select Source Library First --' : '-- Choose Connected Destination --'}
              </option>
              {availableDestinationLibraries.map((lib) => (
                <option key={lib.id} value={lib.id}>
                  {lib.name} ({lib.city})
                </option>
              ))}
            </select>
          </div>
          {sourceLibraryId && availableDestinationLibraries.length === 0 && (
            <p className="text-xs text-amber-400 mt-1.5">
              No active connected travel routes found originating from this library.
            </p>
          )}
        </div>

        {/* Due Date Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Due Return Date</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Confirm Booking CTA */}
        <button
          type="submit"
          disabled={submitting || !selectedBookId || !sourceLibraryId || !destinationLibraryId}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {submitting ? 'Creating Rental...' : 'Confirm Book Rental'} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
