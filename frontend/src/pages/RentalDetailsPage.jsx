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
  QrCode
} from 'lucide-react';
import { rentalAPI, returnAPI, libraryAPI } from '../services/api';

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
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Rental Receipt...</span>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Rental Receipt Not Found</h2>
        <p className="text-slate-400 text-sm">{error || 'The requested rental code does not exist.'}</p>
        <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold">
          Return to My Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold mb-2">
            Rental Code: {rental.rental_code}
          </div>
          <h1 className="text-3xl font-black text-white">Travel Rental Receipt</h1>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              rental.status === 'rented'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            Status: {rental.status}
          </span>
          {rental.status === 'rented' && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Process Return Dropoff
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Explicit Journey Visualization Flow */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-1.5">
            <Compass className="h-4 w-4" /> Active Passenger Route Flow
          </span>
          <h2 className="text-xl font-extrabold text-white">Travel Journey Map</h2>
        </div>

        {/* Visual Diagram */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
          {/* Pickup Step */}
          <div className="flex-1 w-full p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 relative">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Pickup</div>
            <div className="font-extrabold text-white text-base">{rental.source_library_name}</div>
            <div className="text-xs text-indigo-300 font-semibold">{rental.source_library_city}</div>
          </div>

          {/* Travel Transition Arrow */}
          <div className="flex flex-col items-center justify-center space-y-1 text-slate-500 py-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1">
              <Navigation className="h-3 w-3 animate-pulse" /> Travel / Transit
            </div>
            <ArrowRight className="h-6 w-6 text-indigo-400 hidden md:block" />
            <div className="text-xs font-mono text-slate-400">Due: {new Date(rental.due_date).toLocaleDateString()}</div>
          </div>

          {/* Dropoff Step */}
          <div className="flex-1 w-full p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 relative">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destination Dropoff</div>
            <div className="font-extrabold text-white text-base">{rental.destination_library_name}</div>
            <div className="text-xs text-emerald-300 font-semibold">{rental.destination_library_city}</div>
          </div>
        </div>
      </div>

      {/* Full Receipt Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
          <span>Borrower & Item Details</span>
          <QrCode className="h-5 w-5 text-slate-500" />
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold block">Book Title</span>
              <span className="font-extrabold text-white text-base flex items-center gap-2 mt-0.5">
                <BookOpen className="h-4 w-4 text-indigo-400" /> {rental.book_title}
              </span>
              <span className="text-xs text-slate-400 font-mono">Author: {rental.author} | ISBN: {rental.isbn}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold block">Passenger Name</span>
              <span className="font-bold text-slate-200 mt-0.5 block">{rental.passenger_name}</span>
              <span className="text-xs text-slate-400 font-mono">{rental.passenger_email}</span>
            </div>
          </div>

          <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800 md:pl-6 pt-4 md:pt-0">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold block">Rental Date</span>
              <span className="font-semibold text-slate-200 mt-0.5 block font-mono">
                {new Date(rental.rental_date).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold block">Return Due Date</span>
              <span className="font-extrabold text-amber-400 mt-0.5 block font-mono text-base">
                {new Date(rental.due_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Return Check-in Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-emerald-400" /> Process Return Dropoff
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Select Return Dropoff Library
                </label>
                <select
                  required
                  value={returnLibraryId}
                  onChange={(e) => setReturnLibraryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {libraries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Returned Book Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="good">Good Condition</option>
                  <option value="damaged">Slightly Damaged</option>
                  <option value="lost">Lost / Missing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Check-in Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Returned on time at Station Platform 1 desk..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
                >
                  {submittingReturn ? 'Processing Check-in...' : 'Confirm Return Dropoff'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
