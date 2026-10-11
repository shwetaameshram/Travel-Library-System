import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  RotateCcw, 
  Compass, 
  Navigation,
  Sparkles,
  QrCode,
  RefreshCw
} from 'lucide-react';
import { rentalAPI, returnAPI, libraryAPI } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import SectionHeading from '../components/ui/SectionHeading';
import JourneyPath from '../components/ui/JourneyPath';
import StatusBadge from '../components/ui/StatusBadge';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function RentalDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rental, setRental] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Return Check-in Modal Form State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnLibraryId, setReturnLibraryId] = useState('');
  const [condition, setCondition] = useState('good');
  const [remarks, setRemarks] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [rentalRes, libRes] = await Promise.all([
        rentalAPI.getRentalById(id),
        libraryAPI.getAllLibraries(),
      ]);

      if (rentalRes.success && rentalRes.data) {
        setRental(rentalRes.data);
        setReturnLibraryId(rentalRes.data.destination_library_id || '');
      } else {
        setError('Rental transaction not found.');
      }

      if (libRes.success) {
        setLibraries(libRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error loading rental receipt details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReturn(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await returnAPI.processReturn({
        rental_id: rental.id,
        return_library_id: Number(returnLibraryId),
        condition,
        remarks,
      });

      if (res.success) {
        setSuccessMsg('Book returned successfully! Inventory stock has been updated.');
        setShowReturnModal(false);
        fetchDetails();
      }
    } catch (err) {
      setError(err.message || 'Failed to process return.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4 font-medium">
        <Mascot type="main" size="md" float speech="Loading Receipt..." />
        <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
          <span>Loading Rental Receipt...</span>
        </div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="max-w-xl mx-auto my-12">
        <GlassCard className="p-8 text-center space-y-4 border-purple-200">
          <ShieldAlert className="h-12 w-12 text-rose-600 mx-auto" />
          <h2 className="text-2xl font-black text-slate-900">Rental Receipt Not Found</h2>
          <p className="text-slate-600 text-sm font-medium">{error || 'The requested rental code does not exist.'}</p>
          <Link to="/dashboard">
            <PrimaryButton variant="primary">
              Return to My Dashboard
            </PrimaryButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-xs font-mono font-extrabold mb-2">
            Rental Code: {rental.rental_code}
          </div>
          <h1 className="text-3xl font-black text-slate-900">Travel Rental Receipt</h1>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={rental.status} />
          {rental.status === 'rented' && (
            <PrimaryButton
              variant="primary"
              onClick={() => setShowReturnModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-xs"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Process Return Dropoff</span>
            </PrimaryButton>
          )}
        </div>
      </div>

      {successMsg && (
        <GlassCard className="p-4 bg-emerald-50/90 border-emerald-200 text-emerald-900 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-extrabold">{successMsg}</span>
        </GlassCard>
      )}

      {/* Explicit Journey Path Flow */}
      <GlassCard className="p-8 space-y-6 border-white/80">
        <SectionHeading
          badge="Passenger Route"
          title="Travel Journey Route"
          subtitle="Borrow at origin station, read during travel, return at destination."
          align="left"
        />
        <JourneyPath source={rental.source_library_name} destination={rental.destination_library_name} />
      </GlassCard>

      {/* Full Digital Receipt Details */}
      <GlassCard className="p-8 space-y-8 border-white/80 shadow-lg">
        <div className="flex items-center justify-between border-b border-purple-100 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-extrabold text-slate-900">Book & Passenger Summary</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono font-bold">
            <QrCode className="h-4 w-4" /> Digital Verification
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-medium">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 uppercase font-extrabold block">Book Title</span>
              <span className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mt-0.5">
                {rental.book_title}
              </span>
              <span className="text-xs text-purple-700 font-bold font-mono">Author: {rental.book_author || rental.author}</span>
            </div>

            <div>
              <span className="text-xs text-slate-500 uppercase font-extrabold block">Passenger Name</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">{rental.user_name || rental.passenger_name}</span>
              <span className="text-xs text-slate-500 font-mono">{rental.user_email || rental.passenger_email}</span>
            </div>
          </div>

          <div className="space-y-4 border-t md:border-t-0 md:border-l border-purple-100 md:pl-8 pt-4 md:pt-0">
            <div>
              <span className="text-xs text-slate-500 uppercase font-extrabold block">Rental Date</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block font-mono">
                {new Date(rental.rental_date).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 uppercase font-extrabold block">Return Due Date</span>
              <span className="font-black text-amber-700 mt-0.5 block font-mono text-lg">
                {new Date(rental.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Deposit & Financial Summary Card */}
        <div className="border-t border-purple-100 pt-6 space-y-4">
          <h4 className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">
            Deposit & Financial Breakdown
          </h4>
          <div className="glass-panel p-6 rounded-2xl border-purple-200 font-mono text-xs space-y-3 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
            <div className="flex justify-between border-b border-purple-100 pb-2">
              <span className="text-slate-600 font-semibold">Transaction ID:</span>
              <span className="font-extrabold text-purple-800">{rental.transaction_id || `TXN-TL-${rental.id}`}</span>
            </div>
            <div className="flex justify-between border-b border-purple-100 pb-2">
              <span className="text-slate-600 font-semibold">Book Value:</span>
              <span className="text-slate-900 font-bold">₹{rental.book_value}</span>
            </div>
            <div className="flex justify-between border-b border-purple-100 pb-2">
              <span className="text-slate-600 font-semibold">Rental Fee:</span>
              <span className="text-slate-900 font-bold">₹{rental.rental_fee}</span>
            </div>
            <div className="flex justify-between border-b border-purple-100 pb-2">
              <span className="text-slate-600 font-semibold">Security Deposit (Paid):</span>
              <span className="text-emerald-700 font-extrabold">₹{rental.security_deposit || rental.amount_paid}</span>
            </div>
            <div className="flex justify-between border-b border-purple-100 pb-2">
              <span className="text-slate-600 font-semibold">Payment Status:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold uppercase">
                {rental.payment_status || 'PAID'}
              </span>
            </div>

            {rental.status === 'returned' && (
              <>
                <div className="flex justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-600 font-semibold">Late Fee Deduction:</span>
                  <span className="text-rose-700 font-bold">₹{rental.late_fee || 0}</span>
                </div>
                <div className="flex justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-600 font-semibold">Damage Deduction:</span>
                  <span className="text-rose-700 font-bold">₹{rental.damage_fee || 0}</span>
                </div>
                <div className="flex justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-600 font-semibold">Refund Amount:</span>
                  <span className="text-emerald-700 font-black text-sm">₹{rental.refund_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Refund Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-extrabold uppercase">
                    {rental.refund_status || 'REFUNDED'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Return Dropoff Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg space-y-6 shadow-2xl border-white/90 bg-white/95">
            <div className="flex items-center justify-between border-b border-purple-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-emerald-600" /> Process Return Dropoff
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-700 font-extrabold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Return Dropoff Library
                </label>
                <select
                  required
                  value={returnLibraryId}
                  onChange={(e) => setReturnLibraryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                >
                  {libraries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Returned Book Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="good">Good Condition</option>
                  <option value="damaged">Slightly Damaged</option>
                  <option value="lost">Lost / Missing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Check-in Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Returned on time at Station Platform 1 desk..."
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-purple-100">
                <PrimaryButton
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                >
                  {submittingReturn ? 'Processing Check-in...' : 'Confirm Return Dropoff'}
                </PrimaryButton>
                <PrimaryButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowReturnModal(false)}
                >
                  Cancel
                </PrimaryButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
