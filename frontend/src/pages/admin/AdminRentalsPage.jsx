import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, AlertCircle, Calendar, User, BookOpen, MapPin } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [error, setError] = useState('');

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRentals({ status: statusFilter, rental_code: searchCode });
      if (res.success) {
        setRentals(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch rentals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [statusFilter, searchCode]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Audit Travel Rentals</h1>
        <p className="text-sm text-slate-400">View and filter passenger rental borrowing records across the network.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Rental ID / Code (e.g. TL-1001)..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              statusFilter === ''
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setStatusFilter('rented')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              statusFilter === 'rented'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            RENTED
          </button>
          <button
            onClick={() => setStatusFilter('returned')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              statusFilter === 'returned'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            RETURNED
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rentals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Rental Code</th>
                <th className="p-4">Passenger</th>
                <th className="p-4">Book Title</th>
                <th className="p-4">Source Pickup</th>
                <th className="p-4">Destination Return</th>
                <th className="p-4">Rental Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rentals.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-amber-400">{r.rental_code}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{r.passenger_name}</div>
                    <div className="text-xs text-slate-500">{r.passenger_email}</div>
                  </td>
                  <td className="p-4 font-medium text-slate-200">{r.book_title}</td>
                  <td className="p-4 text-xs text-slate-400">{r.source_library_name}</td>
                  <td className="p-4 text-xs text-slate-400">{r.destination_library_name}</td>
                  <td className="p-4 text-xs text-slate-400 font-mono">
                    {new Date(r.rental_date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-xs font-mono text-amber-400 font-semibold">
                    {new Date(r.due_date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                        r.status === 'rented'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
