import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, RotateCcw, BookOpen, Calendar, ArrowRight, ShieldAlert, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { rentalAPI } from '../services/api';

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchUserRentals = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await rentalAPI.getRentalsByUser(user.id);
      if (res.success) {
        setRentals(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your rentals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (user) {
      fetchUserRentals();
    }
  }, [user, isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
        <span>Loading Passenger Dashboard...</span>
      </div>
    );
  }

  const activeRentals = rentals.filter((r) => r.status === 'rented');
  const returnedRentals = rentals.filter((r) => r.status === 'returned');
  const totalRentals = rentals.length;

  const statCards = [
    { title: 'Active Rentals', count: activeRentals.length, icon: ShoppingBag, color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/20' },
    { title: 'Returned Books', count: returnedRentals.length, icon: RotateCcw, color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'Total Rentals', count: totalRentals, icon: BookOpen, color: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, <span className="text-indigo-400">{user?.name}</span>!
          </h1>
          <p className="text-sm text-slate-400">Track active travel book rentals and view your return history.</p>
        </div>
        <Link
          to="/books"
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" /> Rent Another Book
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${card.color} p-6 rounded-3xl border backdrop-blur-md flex items-center justify-between shadow-xl`}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">{card.title}</div>
                <div className="text-4xl font-black text-white mt-2">{card.count}</div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Rentals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-400" /> Active Travel Rentals ({activeRentals.length})
          </h2>
        </div>

        {activeRentals.length === 0 ? (
          <div className="text-center py-8 text-slate-500 space-y-2">
            <p className="text-sm">You currently have no active book rentals.</p>
            <Link to="/books" className="inline-block text-xs font-bold text-indigo-400 hover:text-indigo-300">
              Browse books to start reading on your trip &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Rental Code</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Pickup Library</th>
                  <th className="p-3.5">Destination Return</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeRentals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-amber-400">{r.rental_code}</td>
                    <td className="p-3.5 font-bold text-white">{r.book_title}</td>
                    <td className="p-3.5 text-slate-400 text-xs">{r.source_library_name}</td>
                    <td className="p-3.5 text-slate-400 text-xs">{r.destination_library_name}</td>
                    <td className="p-3.5 font-mono text-amber-400 text-xs">
                      {new Date(r.due_date).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        RENTED
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/rentals/${r.id}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        View Receipt <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Rentals Table */}
      {returnedRentals.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-emerald-400" /> Returned Books History ({returnedRentals.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Rental Code</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Pickup</th>
                  <th className="p-3.5">Returned At</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 rounded-r-xl text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {returnedRentals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">{r.rental_code}</td>
                    <td className="p-3.5 font-medium text-slate-200">{r.book_title}</td>
                    <td className="p-3.5 text-slate-400 text-xs">{r.source_library_name}</td>
                    <td className="p-3.5 text-slate-400 text-xs">{r.destination_library_name}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        RETURNED
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/rentals/${r.id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        View Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
