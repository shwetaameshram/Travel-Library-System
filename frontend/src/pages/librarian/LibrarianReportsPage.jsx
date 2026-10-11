import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  BookOpen, 
  CheckCircle2, 
  ShoppingBag, 
  RotateCcw, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  History 
} from 'lucide-react';
import { librarianAPI } from '../../services/api';

export default function LibrarianReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await librarianAPI.getReports();
      if (res.success) {
        setReports(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate branch reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const summary = reports?.summary || {};
  const topBooks = reports?.top_books || [];
  const activityLog = reports?.activity_log || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-400" /> Branch Performance Analytics & Reports
          </h1>
          <p className="text-sm text-slate-400">Detailed analytics on branch inventory, circulation rates, and transaction activity.</p>
        </div>

        <button
          onClick={fetchReports}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Refresh Analytics"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
          <span>Generating Real-time Reports...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Total Titles</span>
                <BookOpen className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{summary.total_books}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Total Copies</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{summary.total_copies}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Active Rentals</span>
                <ShoppingBag className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-2">{summary.active_rentals}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Overdue Loans</span>
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 mt-2">{summary.overdue_rentals}</div>
            </div>
          </div>

          {/* Top Rented Books & Circulation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" /> Most Rented Books at Station
              </h2>

              {topBooks.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">No rental activity data recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {topBooks.map((b, idx) => (
                    <div key={b.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{b.title}</div>
                          <div className="text-slate-400">{b.author} • <span className="text-emerald-400">{b.genre}</span></div>
                        </div>
                      </div>

                      <div className="text-right font-extrabold text-white">
                        {b.total_rentals} rentals
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Audit Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-400" /> Recent Station Activity Audit
              </h2>

              {activityLog.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">No activity recorded.</div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {activityLog.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-400 font-bold">{log.rental_code}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.status === 'returned' ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-slate-200"><span className="font-bold text-white">{log.passenger_name}</span> rented <span className="italic">{log.book_title}</span></div>
                      <div className="text-slate-500 text-[10px]">Route: {log.source_library_name} → {log.destination_library_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
