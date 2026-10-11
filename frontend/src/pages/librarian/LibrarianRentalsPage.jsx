import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  RefreshCw, 
  Filter, 
  X, 
  CheckCircle2, 
  Calendar, 
  User, 
  MapPin, 
  BookOpen 
} from 'lucide-react';
import { librarianAPI } from '../../services/api';

export default function LibrarianRentalsPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form dropdown options
  const [passengers, setPassengers] = useState([]);
  const [books, setBooks] = useState([]);
  const [libraries, setLibraries] = useState([]);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    book_id: '',
    destination_library_id: '',
    due_date: ''
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRentals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await librarianAPI.getRentals({ search, status: statusFilter });
      if (res.success) {
        setRentals(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load branch rentals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [search, statusFilter]);

  const handleOpenCreateModal = async () => {
    setModalError('');
    setShowCreateModal(true);
    try {
      const [passRes, booksRes, libsRes] = await Promise.all([
        librarianAPI.getPassengers(),
        librarianAPI.getBooks(),
        librarianAPI.getConnectedLibraries()
      ]);

      if (passRes.success) setPassengers(passRes.data || []);
      if (booksRes.success) setBooks((booksRes.data || []).filter(b => b.available_quantity > 0));
      if (libsRes.success) setLibraries(libsRes.data || []);

      // Set default due date to 14 days from today
      const future = new Date();
      future.setDate(future.getDate() + 14);
      const defaultDateStr = future.toISOString().split('T')[0];

      setFormData({
        user_id: passRes.data?.[0]?.id || '',
        book_id: booksRes.data?.find(b => b.available_quantity > 0)?.id || '',
        destination_library_id: libsRes.data?.[0]?.id || '',
        due_date: defaultDateStr
      });
    } catch (err) {
      setModalError('Failed to load form options.');
    }
  };

  const handleCreateRental = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      const res = await librarianAPI.createRental(formData);
      if (res.success) {
        setShowCreateModal(false);
        fetchRentals();
      } else {
        setModalError(res.message || 'Failed to create rental.');
      }
    } catch (err) {
      setModalError(err.message || 'Error creating rental.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-400" /> Station Book Rentals
          </h1>
          <p className="text-sm text-slate-400">Issue new rentals for passengers and track active journey loans.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRentals}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Rentals"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Issue Passenger Rental
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by code, passenger name, or book title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="rented">Active Rented</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Loading Branch Rentals...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : rentals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <ShoppingBag className="h-10 w-10 mx-auto opacity-40 text-slate-400" />
            <p>No rentals found for this branch matching your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Rental Code & Book</th>
                  <th className="p-3.5">Passenger</th>
                  <th className="p-3.5">Route (Origin → Destination)</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5 rounded-r-xl text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rental.rental_code}
                      </span>
                      <div className="font-bold text-white mt-1">{rental.book_title}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{rental.passenger_name}</div>
                      <div className="text-xs text-slate-400">{rental.passenger_email}</div>
                    </td>
                    <td className="p-3.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span>{rental.source_library_name}</span>
                        <span className="text-emerald-400 font-bold">→</span>
                        <span>{rental.destination_library_name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-400">
                      <div>Rented: {new Date(rental.rental_date).toLocaleDateString()}</div>
                      <div>Due: <span className="font-semibold text-white">{new Date(rental.due_date).toLocaleDateString()}</span></div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                          rental.status === 'returned'
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : rental.status === 'overdue'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {rental.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE RENTAL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-400" /> Issue Passenger Rental
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateRental} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Passenger *</label>
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Passenger...</option>
                  {passengers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Book (Available at your Station) *</label>
                <select
                  required
                  value={formData.book_id}
                  onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Book...</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} - {b.author} ({b.available_quantity} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Return Destination Branch *</label>
                  <select
                    required
                    value={formData.destination_library_id}
                    onChange={(e) => setFormData({ ...formData, destination_library_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Destination Library...</option>
                    {libraries.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Issuing...' : 'Create Rental'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
