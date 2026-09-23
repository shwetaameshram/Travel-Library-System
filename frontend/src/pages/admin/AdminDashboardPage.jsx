import React, { useState, useEffect } from 'react';
import { BookOpen, Building2, ShoppingBag, RotateCcw, CheckCircle2, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentRentals, setRecentRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data.stats);
        setRecentRentals(res.data.recentRentals || []);
      } else {
        setError('Failed to load dashboard statistics.');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to admin backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-rose-500" />
        <span>Loading Admin Overview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <p className="text-white font-semibold">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Books', count: stats?.total_books || 0, icon: BookOpen, color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20' },
    { title: 'Total Libraries', count: stats?.total_libraries || 0, icon: Building2, color: 'from-purple-500/20 to-violet-500/10 text-purple-400 border-purple-500/20' },
    { title: 'Active Rentals', count: stats?.active_rentals || 0, icon: ShoppingBag, color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/20' },
    { title: 'Returned Rentals', count: stats?.returned_rentals || 0, icon: RotateCcw, color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'Available Copies', count: stats?.available_books || 0, icon: CheckCircle2, color: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-400">Real-time system stats and recent travel book rental activities.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${card.color} p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{card.title}</span>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-black text-white">{card.count}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Rentals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-400" /> Recent Travel Rentals
          </h2>
          <span className="text-xs text-slate-400 font-mono">Last 5 Transactions</span>
        </div>

        {recentRentals.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No recent rental transactions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Code</th>
                  <th className="p-3.5">Passenger</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Pickup</th>
                  <th className="p-3.5">Return Dropoff</th>
                  <th className="p-3.5 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentRentals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-indigo-400 font-bold">{r.rental_code}</td>
                    <td className="p-3.5 font-medium text-white">{r.passenger_name}</td>
                    <td className="p-3.5 text-slate-200">{r.book_title}</td>
                    <td className="p-3.5 text-slate-400 text-xs">{r.source_library_name}</td>
                    <td className="p-3.5 text-slate-400 text-xs">{r.destination_library_name}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${
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
        )}
      </div>
    </div>
  );
}
