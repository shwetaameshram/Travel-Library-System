import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  ShoppingBag, 
  RotateCcw, 
  AlertTriangle, 
  Users, 
  Building2, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import { librarianAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/ui/GlassCard';
import Mascot from '../../components/ui/Mascot';
import SectionHeading from '../../components/ui/SectionHeading';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import PrimaryButton from '../../components/ui/PrimaryButton';

export default function LibrarianDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await librarianAPI.getDashboardStats();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load librarian dashboard stats.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching librarian dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4 font-medium">
        <Mascot type="main" size="md" float speech="Syncing Branch Data..." />
        <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
          <span>Loading Branch Dashboard Statistics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <GlassCard className="p-8 text-center space-y-4 border-rose-200 bg-rose-50/90 text-rose-800">
        <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
        <h2 className="text-xl font-extrabold text-slate-900">Unable to Load Dashboard</h2>
        <p className="text-sm font-medium">{error || 'No stats found for this library location.'}</p>
        <div>
          <PrimaryButton onClick={fetchStats} className="bg-rose-600 hover:bg-rose-700">
            Try Again
          </PrimaryButton>
        </div>
      </GlassCard>
    );
  }

  const { library, stats, recent_rentals } = data;

  return (
    <div className="space-y-8">
      {/* Header Glass Banner */}
      <GlassCard className="p-8 border-white/80 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" /> Assigned Station Library Branch
            </div>
            <h1 className="text-3xl md:text-4xl font-black">{library.name}</h1>
            <div className="flex items-center gap-3 text-purple-200 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-purple-300" /> {library.location} ({library.city})
              </span>
              <span>•</span>
              <span className="capitalize px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px]">
                Type: {library.type}
              </span>
            </div>
          </div>

          <PrimaryButton
            variant="secondary"
            onClick={fetchStats}
            className="bg-white text-purple-900 hover:bg-purple-50 shrink-0"
          >
            <RefreshCw className="h-4 w-4 text-purple-700" />
            <span>Refresh Stats</span>
          </PrimaryButton>
        </div>
      </GlassCard>

      {/* Grid of 6 Real-time Database Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={BookOpen}
          value={stats.total_books}
          label="Total Books"
          subtext="Distinct titles in catalog"
          gradient="from-purple-500 to-indigo-600"
        />
        <StatCard
          icon={Layers}
          value={`${stats.available_copies} / ${stats.total_copies}`}
          label="Available Copies"
          subtext="In-stock physical copies"
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={ShoppingBag}
          value={stats.active_rentals}
          label="Active Outbound Rentals"
          subtext="Currently borrowed outbound"
          gradient="from-amber-500 to-orange-600"
        />
        <StatCard
          icon={RotateCcw}
          value={stats.pending_returns}
          label="Pending Dropoffs"
          subtext="Expected incoming return dropoffs"
          gradient="from-blue-500 to-indigo-600"
        />
        <StatCard
          icon={AlertTriangle}
          value={stats.overdue_rentals}
          label="Overdue Rentals"
          subtext="Past return due date"
          gradient={stats.overdue_rentals > 0 ? "from-rose-500 to-red-600" : "from-slate-500 to-slate-700"}
        />
        <StatCard
          icon={Users}
          value={stats.total_passengers}
          label="Unique Borrowers"
          subtext="Distinct passengers at this branch"
          gradient="from-violet-500 to-purple-600"
        />
      </div>

      {/* Recent Branch Activity Table */}
      <GlassCard className="p-8 space-y-6 border-white/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="h-6 w-6 text-purple-600" /> Recent Branch Transactions
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Latest rentals originating from or arriving at {library.name}</p>
          </div>
        </div>

        {recent_rentals.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            No recent rental transactions logged for this branch yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-purple-50/80 text-purple-900 text-xs font-extrabold uppercase tracking-wider border-b border-purple-100">
                <tr>
                  <th className="py-4 px-4 rounded-l-2xl">Rental Code</th>
                  <th className="py-4 px-4">Book Title</th>
                  <th className="py-4 px-4">Passenger</th>
                  <th className="py-4 px-4">Route</th>
                  <th className="py-4 px-4">Due Date</th>
                  <th className="py-4 px-4 rounded-r-2xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60 font-medium">
                {recent_rentals.map((r) => (
                  <tr key={r.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-extrabold text-purple-700">{r.rental_code}</td>
                    <td className="py-4 px-4 font-extrabold text-slate-900">{r.book_title}</td>
                    <td className="py-4 px-4 text-slate-600 text-xs">{r.passenger_name}</td>
                    <td className="py-4 px-4 text-xs font-semibold">
                      <span className="text-purple-900">{r.source_library_name}</span>
                      <span className="mx-1 text-purple-400">➔</span>
                      <span className="text-indigo-900">{r.destination_library_name}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-amber-700 font-extrabold">
                      {new Date(r.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4">
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
