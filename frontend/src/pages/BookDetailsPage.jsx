import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, MapPin, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, BookmarkPlus } from 'lucide-react';
import { bookAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await bookAPI.getBookById(id);
        if (res.success && res.data) {
          setBookData(res.data);
        } else {
          setError('Book details not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch book details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleRent = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/rent?book_id=${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
        <span>Loading book details...</span>
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">{error || 'Book Not Found'}</h2>
          <Link to="/books" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
            Back to Books Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/books" className="hover:text-indigo-400 transition-colors">Books</Link>
        <span>/</span>
        <span className="text-slate-200">{bookData.title}</span>
      </nav>

      {/* Main Book Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
              {bookData.category}
            </span>
            
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{bookData.title}</h1>
            <p className="text-lg text-slate-300 font-medium">Author: <span className="text-white">{bookData.author}</span></p>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span>ISBN: {bookData.isbn}</span>
              <span>•</span>
              <span>Added: {new Date(bookData.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <button
            onClick={handleRent}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all self-start cursor-pointer"
          >
            <BookmarkPlus className="h-5 w-5" /> Rent This Book
          </button>
        </div>

        {/* Stock & Branch Availability Table */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-400" /> Availability Across Library Branches
          </h2>

          {!bookData.availability || bookData.availability.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-sm">
              Currently not stocked in any physical branch.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookData.availability.map((item) => (
                <div key={item.library_id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="font-semibold text-white text-sm">{item.library_name}</div>
                  <div className="text-xs text-slate-400">{item.location} ({item.city})</div>
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-900">
                    <span className="text-slate-500">Total Stock: {item.quantity}</span>
                    <span className={`font-semibold flex items-center gap-1 ${item.available_quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {item.available_quantity} available
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
