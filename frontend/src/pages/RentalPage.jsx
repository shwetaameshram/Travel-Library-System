import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { BookmarkPlus, MapPin, Calendar, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, BookOpen, CreditCard, ShieldCheck, Lock, Train, Sparkles } from 'lucide-react';
import { bookAPI, libraryAPI, connectionAPI, rentalAPI, paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import SectionHeading from '../components/ui/SectionHeading';
import JourneyPath from '../components/ui/JourneyPath';

// Helper to dynamically load Razorpay Checkout script safely
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function RentalPage() {
  const [searchParams] = useSearchParams();
  const bookIdFromUrl = searchParams.get('book_id') || searchParams.get('bookId');
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
  const [paymentStep, setPaymentStep] = useState(''); // 'creating_order' | 'checkout_open' | 'verifying' | 'confirming_rental'
  const [error, setError] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [verifiedPaymentOrderId, setVerifiedPaymentOrderId] = useState(null);
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

  // Main Razorpay Payment + Rental Submission Handler (UNTOUCHED BUSINESS LOGIC)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setPaymentNotice('');

    if (!selectedBookId || !sourceLibraryId || !destinationLibraryId) {
      setError('Please select a book, source library, and destination library.');
      return;
    }

    setSubmitting(true);
    setPaymentStep('creating_order');

    try {
      // 1. Create Razorpay Order on backend (Server calculates final fee)
      let orderRes;
      try {
        orderRes = await paymentAPI.createPaymentOrder({
          user_id: user.id,
          book_id: Number(selectedBookId),
          source_library_id: Number(sourceLibraryId),
          destination_library_id: Number(destinationLibraryId)
        });
      } catch (apiErr) {
        setError(apiErr.message || 'Payment configuration or gateway error. Could not initiate payment order.');
        setSubmitting(false);
        setPaymentStep('');
        setPaymentNotice('');
        return;
      }

      if (!orderRes || !orderRes.success || !orderRes.data) {
        setError(orderRes?.message || 'Failed to initiate Razorpay payment order.');
        setSubmitting(false);
        setPaymentStep('');
        setPaymentNotice('');
        return;
      }

      const orderData = orderRes.data;

      // 2. Load Razorpay Checkout Script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setError('Razorpay Checkout SDK failed to load. Please check your internet connection and try again.');
        setSubmitting(false);
        setPaymentStep('');
        setPaymentNotice('');
        return;
      }

      // 3. Configure Razorpay Modal Options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Travel Library System',
        description: `Refundable Rental Deposit for ${selectedBook?.title || 'Book'}`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.mobile || ''
        },
        theme: {
          color: '#7c3aed'
        },
        handler: async (response) => {
          // Razorpay returns razorpay_payment_id, razorpay_order_id, razorpay_signature
          try {
            setPaymentStep('verifying');
            setPaymentNotice('Payment captured by Razorpay. Verifying signature with server...');

            // 4. Verify Payment Signature on Backend
            const verifyRes = await paymentAPI.verifyPayment({
              user_id: user.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (!verifyRes.success) {
              setError('Payment verification failed. Your rental has not been created. Please contact support.');
              setSubmitting(false);
              setPaymentStep('');
              setPaymentNotice('');
              return;
            }

            // 5. Backend Payment Verified! Now Create Rental
            setPaymentStep('confirming_rental');
            setPaymentNotice('Payment verified! Finalizing book rental booking...');

            const rentalRes = await rentalAPI.createRental({
              user_id: user.id,
              book_id: Number(selectedBookId),
              source_library_id: Number(sourceLibraryId),
              destination_library_id: Number(destinationLibraryId),
              due_date: dueDate,
              razorpay_order_id: response.razorpay_order_id
            });

            if (rentalRes.success && rentalRes.data) {
              setRentalConfirmation({
                ...rentalRes.data,
                rental_code: rentalRes.data.rental_code,
                book_title: selectedBook?.title || `Book #${selectedBookId}`,
                source_name: libraries.find((l) => Number(l.id) === Number(sourceLibraryId))?.name,
                destination_name: libraries.find((l) => Number(l.id) === Number(destinationLibraryId))?.name,
                status: rentalRes.data.status || 'rented'
              });
            } else {
              setVerifiedPaymentOrderId(response.razorpay_order_id);
              setError('Payment was verified successfully, but rental confirmation encountered an issue. Click "Retry Confirm Rental" to complete booking.');
            }
          } catch (err) {
            setError(err.message || 'Payment verification or rental creation failed.');
          } finally {
            setSubmitting(false);
            setPaymentStep('');
            setPaymentNotice('');
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setPaymentStep('');
            setPaymentNotice('');
            setError('Payment was cancelled. Your book rental has not been created.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setSubmitting(false);
        setPaymentStep('');
        setPaymentNotice('');
        setError(`Payment Failed: ${response.error?.description || 'Transaction was declined by Razorpay.'}`);
      });

      setPaymentStep('checkout_open');
      setPaymentNotice('Complete payment in the Razorpay Checkout window...');
      rzp.open();
    } catch (err) {
      setError(err.message || 'Error processing payment order.');
      setSubmitting(false);
      setPaymentStep('');
      setPaymentNotice('');
    }
  };

  // Safe Retry Handler if Payment Verified but Rental Creation Failed
  const handleRetryRentalCreation = async () => {
    if (!verifiedPaymentOrderId) return;
    setSubmitting(true);
    setPaymentStep('confirming_rental');
    setError('');

    try {
      const rentalRes = await rentalAPI.createRental({
        user_id: user.id,
        book_id: Number(selectedBookId),
        source_library_id: Number(sourceLibraryId),
        destination_library_id: Number(destinationLibraryId),
        due_date: dueDate,
        razorpay_order_id: verifiedPaymentOrderId
      });

      if (rentalRes.success && rentalRes.data) {
        setRentalConfirmation({
          ...rentalRes.data,
          rental_code: rentalRes.data.rental_code,
          book_title: selectedBook?.title || `Book #${selectedBookId}`,
          source_name: libraries.find((l) => Number(l.id) === Number(sourceLibraryId))?.name,
          destination_name: libraries.find((l) => Number(l.id) === Number(destinationLibraryId))?.name,
          status: rentalRes.data.status || 'rented'
        });
        setVerifiedPaymentOrderId(null);
      } else {
        setError(rentalRes.message || 'Failed to complete rental booking.');
      }
    } catch (err) {
      setError(err.message || 'Rental confirmation retry failed.');
    } finally {
      setSubmitting(false);
      setPaymentStep('');
    }
  };

  const bookValue = selectedBook ? Number(selectedBook.book_value || 500) : 500;
  const rentalFee = selectedBook ? Number(selectedBook.rental_fee || 50) : 50;

  const sourceName = libraries.find((l) => Number(l.id) === Number(sourceLibraryId))?.name;
  const destName = libraries.find((l) => Number(l.id) === Number(destinationLibraryId))?.name;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4 font-medium">
        <Mascot type="main" size="md" float speech="Preparing Payment..." />
        <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
          <span>Loading rental booking options...</span>
        </div>
      </div>
    );
  }

  // Render Confirmation View after verified payment & successful rental
  if (rentalConfirmation) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <GlassCard className="p-8 md:p-10 border-emerald-200 space-y-8 bg-gradient-to-b from-white via-emerald-50/30 to-white">
          <div className="text-center space-y-3">
            <Mascot type="success" size="md" speech="Booking Confirmed!" float />
            <h1 className="text-3xl font-black text-slate-900">Rental Booking Confirmed!</h1>
            <p className="text-slate-600 text-sm font-medium">
              Payment verified via Razorpay & digital rental code generated
            </p>
          </div>

          {/* Journey Path Visual */}
          <JourneyPath source={rentalConfirmation.source_name} destination={rentalConfirmation.destination_name} />

          <div className="glass-panel p-6 rounded-2xl border-purple-200 space-y-3 font-mono text-xs md:text-sm">
            <div className="flex justify-between border-b border-purple-100 pb-2.5">
              <span className="text-slate-500 font-semibold">Rental Code / ID:</span>
              <span className="font-extrabold text-purple-700 text-base">{rentalConfirmation.rental_code}</span>
            </div>
            <div className="flex justify-between border-b border-purple-100 pb-2.5">
              <span className="text-slate-500 font-semibold">Book Title:</span>
              <span className="font-extrabold text-slate-900">{rentalConfirmation.book_title}</span>
            </div>
            <div className="flex justify-between border-b border-purple-100 pb-2.5">
              <span className="text-slate-500 font-semibold">Source Library:</span>
              <span className="text-slate-800 font-bold">{rentalConfirmation.source_name}</span>
            </div>
            <div className="flex justify-between border-b border-purple-100 pb-2.5">
              <span className="text-slate-500 font-semibold">Destination Library:</span>
              <span className="text-slate-800 font-bold">{rentalConfirmation.destination_name}</span>
            </div>
            <div className="flex justify-between border-b border-purple-100 pb-2.5">
              <span className="text-slate-500 font-semibold">Due Return Date:</span>
              <span className="text-amber-700 font-extrabold">
                {new Date(rentalConfirmation.due_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 font-semibold">Payment Status:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold uppercase">
                PAID & VERIFIED (RAZORPAY)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={rentalConfirmation.id ? `/rentals/${rentalConfirmation.id}` : "/dashboard"}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-center text-sm shadow-md transition-all"
            >
              View Digital Receipt
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 py-3.5 rounded-2xl glass-panel hover:bg-white text-slate-800 font-extrabold text-center text-sm transition-all border-purple-200"
            >
              Go to My Rentals
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Get dynamic button text based on payment step
  const getButtonText = () => {
    if (paymentStep === 'creating_order') return 'Creating Payment Order...';
    if (paymentStep === 'checkout_open') return 'Complete Payment in Razorpay...';
    if (paymentStep === 'verifying') return 'Verifying Payment Signature...';
    if (paymentStep === 'confirming_rental') return 'Confirming Book Rental...';
    if (submitting) return 'Processing...';
    return `Pay ₹${bookValue} & Reserve Book`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SectionHeading
        badge="Razorpay Checkout"
        title="Book Rental Booking"
        subtitle="Reserve a book at your departure library and complete payment securely via Razorpay"
        align="left"
      />

      {error && (
        <GlassCard className="p-5 bg-rose-50/90 border-rose-200 text-rose-800 text-sm space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
            <span className="font-extrabold">{error}</span>
          </div>
          {verifiedPaymentOrderId && (
            <button
              onClick={handleRetryRentalCreation}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs cursor-pointer shadow-sm"
            >
              Retry Confirm Rental
            </button>
          )}
        </GlassCard>
      )}

      {paymentNotice && (
        <GlassCard className="p-5 bg-purple-50/90 border-purple-200 text-purple-900 text-sm flex items-center gap-3 animate-pulse">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600 shrink-0" />
          <span className="font-extrabold">{paymentNotice}</span>
        </GlassCard>
      )}

      <form onSubmit={handleSubmit}>
        <GlassCard className="p-8 space-y-6 border-purple-200/80 shadow-lg">
          {/* Book Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Select Book</label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <select
                value={selectedBookId}
                onChange={handleBookChange}
                disabled={submitting}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 cursor-pointer disabled:opacity-50"
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
            <div className="p-4 rounded-2xl glass-panel bg-purple-50/70 border-purple-200 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider">{selectedBook.category}</div>
                <div className="font-extrabold text-slate-900 text-base">{selectedBook.title}</div>
                <div className="text-xs text-slate-500 font-medium">by {selectedBook.author}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> In Stock
                </span>
              </div>
            </div>
          )}

          {/* Source Library Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Source Library (Departure / Pickup Location)
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <select
                value={sourceLibraryId}
                onChange={handleSourceLibraryChange}
                disabled={submitting}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 cursor-pointer disabled:opacity-50"
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

          {/* Destination Library Selector */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              Destination Library (Arrival / Return Location)
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <select
                value={destinationLibraryId}
                onChange={(e) => setDestinationLibraryId(e.target.value)}
                disabled={!sourceLibraryId || submitting}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 cursor-pointer disabled:opacity-50"
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
              <p className="text-xs text-amber-800 font-bold mt-2">
                No active connected travel routes found originating from this library.
              </p>
            )}
          </div>

          {/* Route Preview if both selected */}
          {sourceName && destName && (
            <JourneyPath source={sourceName} destination={destName} />
          )}

          {/* Due Date Picker */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Due Return Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={submitting}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Razorpay Fee & Security Deposit Summary Box */}
          {selectedBook && (
            <div className="glass-panel border-purple-200/90 p-6 rounded-2xl space-y-4 bg-gradient-to-br from-purple-50/60 to-indigo-50/60">
              <div className="flex items-center justify-between border-b border-purple-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-700" />
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Razorpay Payment Summary</span>
                </div>
                <span className="text-xs text-purple-700 font-mono font-bold">INR (₹)</span>
              </div>
              
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Book Security Deposit (Refundable)</span>
                  <span className="text-slate-900 font-bold">₹{bookValue}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Rental Fee (Deducted upon return)</span>
                  <span>₹{rentalFee}</span>
                </div>
                <div className="border-t border-purple-200/80 pt-2 flex justify-between text-base">
                  <span className="text-purple-950 font-black font-sans">Initial Payable Amount</span>
                  <span className="text-purple-700 font-black">₹{bookValue}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Secured by Razorpay. Deposit is 100% refunded when book is returned.</span>
              </div>
            </div>
          )}

          {/* Submit & Pay Button */}
          <button
            type="submit"
            disabled={submitting || !selectedBookId || !sourceLibraryId || !destinationLibraryId}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-95"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>{getButtonText()}</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-purple-200" />
                <span>{getButtonText()}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </GlassCard>
      </form>
    </div>
  );
}
