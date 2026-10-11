import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, MapPin, CheckCircle2, ArrowRight, RefreshCw, AlertCircle, BookmarkPlus, Layers } from 'lucide-react';
import { bookAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import PrimaryButton from '../components/ui/PrimaryButton';
import StatusBadge from '../components/ui/StatusBadge';
import { getBookCover, DEFAULT_BOOK_COVER } from '../utils/bookCovers';

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
      <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4 font-medium">
        <Mascot type="main" size="md" float speech="Fetching Book Details..." />
        <div className="flex items-center gap-2 text-sm font-bold text-[#6D28D9]">
          <RefreshCw className="h-5 w-5 animate-spin text-[#6D28D9]" />
          <span>Loading book catalog details...</span>
        </div>
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <GlassCard className="p-10 text-center space-y-6 border-purple-200">
          <AlertCircle className="h-12 w-12 text-rose-600 mx-auto" />
          <h2 className="text-2xl font-black text-[#24104F]">{error || 'Book Not Found'}</h2>
          <Link to="/books">
            <PrimaryButton variant="primary">
              Back to Books Catalog
            </PrimaryButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const coverSrc = getBookCover(bookData);
  const isAvailable = bookData.availability && bookData.availability.some(a => a.available_quantity > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-bold text-[#4B5563]">
        <Link to="/books" className="hover:text-[#6D28D9] transition-colors">Books Catalog</Link>
        <span>/</span>
        <span className="text-[#24104F] font-black">{bookData.title}</span>
      </nav>

      {/* Main Book Info Glass Card */}
      <GlassCard className="p-8 md:p-10 border-purple-200 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* LEFT: Portrait Book Cover Image */}
          <div className="md:col-span-4 flex justify-center">
            <div className="relative aspect-[2/3] w-full max-w-xs rounded-2xl overflow-hidden shadow-xl border border-purple-200/80 bg-purple-50">
              <img
                src={coverSrc}
                alt={bookData.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (e.target.src !== DEFAULT_BOOK_COVER) {
                    e.target.src = DEFAULT_BOOK_COVER;
                  }
                }}
              />
              <div className="absolute top-3 right-3">
                <StatusBadge status={isAvailable ? 'available' : 'out_of_stock'} />
              </div>
            </div>
          </div>

          {/* RIGHT: Book Details & Actions */}
          <div className="md:col-span-8 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-purple-100 text-[#6D28D9] border border-purple-200 text-xs font-black uppercase tracking-wider">
                  {bookData.category || 'Travel Reading'}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-[#24104F] tracking-tight leading-tight">
                {bookData.title}
              </h1>
              <p className="text-lg text-[#3B2568] font-black">
                Author: <span className="text-[#24104F]">{bookData.author}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#4B5563] font-bold pt-1">
                <span>ISBN: <strong className="text-[#24104F]">{bookData.isbn || '978-0141983769'}</strong></span>
                <span>•</span>
                <span>Refundable Deposit: <strong className="text-[#24104F]">₹{bookData.book_value || 500}</strong></span>
              </div>
            </div>

            <p className="text-sm text-[#4B5563] font-medium leading-relaxed">
              Available for instant reservation across TravelLib station junction branches. Borrow at departure, enjoy reading during transit, and drop off at your destination.
            </p>

            <div className="pt-2">
              <PrimaryButton variant="primary" onClick={handleRent} className="w-full sm:w-auto">
                <BookmarkPlus className="h-5 w-5" />
                <span>Rent This Book</span>
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Stock & Branch Availability Grid */}
        <div className="pt-8 border-t border-purple-100 space-y-4">
          <h2 className="text-xl font-black text-[#24104F] flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#6D28D9]" /> Availability Across Station Branches
          </h2>

          {!bookData.availability || bookData.availability.length === 0 ? (
            <div className="p-5 rounded-2xl glass-panel text-[#4B5563] text-sm font-medium">
              Currently not stocked in any physical branch.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bookData.availability.map((item) => (
                <GlassCard key={item.library_id} className="p-5 border-purple-200 space-y-2 bg-white">
                  <div className="font-black text-[#24104F] text-base">{item.library_name}</div>
                  <div className="text-xs text-[#4B5563] font-bold">{item.location} ({item.city})</div>
                  <div className="pt-3 flex items-center justify-between text-xs border-t border-purple-100 font-bold">
                    <span className="text-[#4B5563]">Total Stock: {item.quantity}</span>
                    <span className={`font-black flex items-center gap-1 ${item.available_quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {item.available_quantity} available
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
