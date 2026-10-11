import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Building2,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import GlassCard from '../../components/ui/GlassCard';
import Mascot from '../../components/ui/Mascot';
import SectionHeading from '../../components/ui/SectionHeading';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import PrimaryButton from '../../components/ui/PrimaryButton';

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
      <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4 font-medium">
        <Mascot type="main" size="md" float speech="Syncing System Core..." />
        <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
          <span>Loading Admin Overview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-8 text-center space-y-4 border-rose-200 bg-rose-50/90 text-rose-800">
        <AlertCircle className="h-10 w-10 text-rose-600 mx-auto" />
        <p className="text-slate-900 font-extrabold">{error}</p>
        <div>
          <PrimaryButton onClick={fetchDashboardData} className="bg-rose-600 hover:bg-rose-700">
            Retry Load
          </PrimaryButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Glass Banner */}
      <GlassCard className="p-8 border-white/80 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-wider text-white">
              System Administration
            </span>
            <h1 className="text-3xl md:text-4xl font-black">TravelLib Admin Control Center</h1>
            <p className="text-purple-100 text-xs font-medium max-w-xl">
              Real-time platform statistics, station librarian management, and network travel rentals overview.
            </p>
          </div>
          <PrimaryButton
            variant="secondary"
            onClick={fetchDashboardData}
            className="bg-white text-purple-900 hover:bg-purple-50 shrink-0"
          >
            <RefreshCw className="h-4 w-4 text-purple-700" />
            <span>Refresh Overview</span>
          </PrimaryButton>
        </div>
      </GlassCard>

      {/* Summary Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={UserCheck}
          value={stats?.total_librarians || 0}
          label="Librarians"
          gradient="from-purple-500 to-indigo-600"
        />
        <StatCard
          icon={CheckCircle2}
          value={stats?.active_librarians || 0}
          label="Active Staff"
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={Users}
          value={stats?.total_users || 0}
          label="Passengers"
          gradient="from-blue-500 to-indigo-600"
        />
        <StatCard
          icon={TrendingUp}
          value={stats?.active_users || 0}
          label="Active Users"
          gradient="from-cyan-500 to-blue-600"
        />
        <StatCard
          icon={Building2}
          value={stats?.total_libraries || 0}
          label="Station Hubs"
          gradient="from-amber-500 to-orange-600"
        />
        <StatCard
          icon={ShoppingBag}
          value={stats?.active_rentals || 0}
          label="Active Rentals"
          gradient="from-purple-600 to-pink-600"
        />
      </div>

      {/* Recent Rentals Table */}
      <GlassCard className="p-8 space-y-6 border-white/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-600" /> Recent Travel Rentals
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time system transactions across all hubs</p>
          </div>
          <span className="text-xs text-purple-700 font-bold font-mono px-3 py-1 bg-purple-50 rounded-full border border-purple-200">
            Last 5 Transactions
          </span>
        </div>

        {recentRentals.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center font-medium">No recent rental transactions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-purple-50/80 text-purple-900 text-xs font-extrabold uppercase tracking-wider border-b border-purple-100">
                <tr>
                  <th className="p-4 rounded-l-2xl">Rental Code</th>
                  <th className="p-4">Passenger</th>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Pickup Hub</th>
                  <th className="p-4">Return Dropoff</th>
                  <th className="p-4 rounded-r-2xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60 font-medium">
                {recentRentals.map((r) => (
                  <tr key={r.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 font-mono font-extrabold text-purple-700">{r.rental_code}</td>
                    <td className="p-4 font-extrabold text-slate-900">{r.passenger_name}</td>
                    <td className="p-4 text-slate-800">{r.book_title}</td>
                    <td className="p-4 text-slate-600 text-xs">{r.source_library_name}</td>
                    <td className="p-4 text-slate-600 text-xs">{r.destination_library_name}</td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
