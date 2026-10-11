import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, RotateCcw, BookOpen, Calendar, ArrowRight, ShieldAlert, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { rentalAPI } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import SectionHeading from '../components/ui/SectionHeading';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import PrimaryButton from '../components/ui/PrimaryButton';

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
      <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4 font-medium">
        <Mascot type="main" size="md" float speech="Fetching Your Rentals..." />
        <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
          <span>Loading Passenger Dashboard...</span>
        </div>
      </div>
    );
  }

  const activeRentals = rentals.filter((r) => r.status === 'rented');
  const returnedRentals = rentals.filter((r) => r.status === 'returned');
  const totalRentals = rentals.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Glass Banner */}
      <GlassCard className="p-8 md:p-10 border-white/80 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-wider text-white">
              Passenger Portal
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-purple-100 text-sm font-medium max-w-xl">
              Track active travel book rentals and view your digital return receipt history.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/books">
              <PrimaryButton variant="secondary" className="bg-white text-purple-900 hover:bg-purple-50">
                <BookOpen className="w-4 h-4 text-purple-700" />
                <span>Rent Another Book</span>
              </PrimaryButton>
            </Link>
            <Mascot type="main" size="sm" float className="hidden sm:inline-flex" />
          </div>
        </div>
      </GlassCard>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={ShoppingBag}
          value={activeRentals.length}
          label="Active Travel Rentals"
          subtext="Books currently in transit"
          gradient="from-amber-500 to-orange-600"
        />
        <StatCard
          icon={RotateCcw}
          value={returnedRentals.length}
          label="Returned Books"
          subtext="Completed trips & deposits refunded"
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={BookOpen}
          value={totalRentals}
          label="Total Travel Rentals"
          subtext="Lifetime rentals on TravelLib"
          gradient="from-purple-500 to-indigo-600"
        />
      </div>

      {error && (
        <GlassCard className="p-4 bg-rose-50/90 border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
          <span className="font-extrabold">{error}</span>
        </GlassCard>
      )}

      {/* Active Rentals Table */}
      <GlassCard className="p-8 space-y-6 border-white/80">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-amber-600" /> Active Travel Rentals ({activeRentals.length})
          </h2>
        </div>

        {activeRentals.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Mascot type="empty" size="md" speech="No active rentals!" float />
            <p className="text-sm font-medium text-slate-600">You currently have no active book rentals in transit.</p>
            <div>
              <Link to="/books">
                <PrimaryButton variant="primary">
                  Browse Books to Start Reading
                </PrimaryButton>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-purple-50/80 text-purple-900 text-xs font-extrabold uppercase tracking-wider border-b border-purple-100">
                <tr>
                  <th className="p-4 rounded-l-2xl">Rental Code</th>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Pickup Library</th>
                  <th className="p-4">Destination Return</th>
                  <th className="p-4">Deposit Paid</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-r-2xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60 font-medium">
                {activeRentals.map((r) => (
                  <tr key={r.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 font-mono font-extrabold text-purple-700">{r.rental_code}</td>
                    <td className="p-4 font-extrabold text-slate-900">{r.book_title}</td>
                    <td className="p-4 text-slate-600 text-xs">{r.source_library_name}</td>
                    <td className="p-4 text-slate-600 text-xs">{r.destination_library_name}</td>
                    <td className="p-4 font-mono text-emerald-700 text-xs font-extrabold">
                      ₹{r.security_deposit || r.amount_paid || 500}
                    </td>
                    <td className="p-4 font-mono text-amber-700 text-xs font-extrabold">
                      {new Date(r.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <StatusBadge status="rented" />
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/rentals/${r.id}`}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition-all inline-flex items-center gap-1.5 shadow-sm hover:scale-105"
                      >
                        <span>View Receipt</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Historical Rentals Table */}
      {returnedRentals.length > 0 && (
        <GlassCard className="p-8 space-y-6 border-white/80">
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-emerald-600" /> Returned Books History ({returnedRentals.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800">
              <thead className="bg-purple-50/80 text-purple-900 text-xs font-extrabold uppercase tracking-wider border-b border-purple-100">
                <tr>
                  <th className="p-4 rounded-l-2xl">Rental Code</th>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Pickup Location</th>
                  <th className="p-4">Refund Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 rounded-r-2xl text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60 font-medium">
                {returnedRentals.map((r) => (
                  <tr key={r.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 font-mono text-slate-600 font-bold">{r.rental_code}</td>
                    <td className="p-4 font-extrabold text-slate-900">{r.book_title}</td>
                    <td className="p-4 text-slate-600 text-xs">{r.source_library_name}</td>
                    <td className="p-4 font-mono text-emerald-700 text-xs font-extrabold">
                      ₹{r.refund_amount !== undefined ? r.refund_amount : 450}
                    </td>
                    <td className="p-4">
                      <StatusBadge status="returned" />
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/rentals/${r.id}`}
                        className="text-xs text-purple-700 hover:text-purple-900 font-extrabold inline-flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
