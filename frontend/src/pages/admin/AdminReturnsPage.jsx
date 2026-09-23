import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, CheckCircle2, Building2, User, BookOpen } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function AdminReturnsPage() {
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReturns();
      if (res.success) {
        setReturnsList(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch returns history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Audit Book Returns</h1>
        <p className="text-sm text-slate-400">Complete log of returned books, dropoff libraries, and condition check-ins.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Returns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Return ID</th>
                <th className="p-4">Rental Code</th>
                <th className="p-4">Passenger</th>
                <th className="p-4">Book Title</th>
                <th className="p-4">Return Library</th>
                <th className="p-4">Return Date</th>
                <th className="p-4">Condition</th>
                <th className="p-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {returnsList.map((ret) => (
                <tr key={ret.return_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono text-slate-400 text-xs">#{ret.return_id}</td>
                  <td className="p-4 font-mono font-bold text-indigo-400">{ret.rental_code}</td>
                  <td className="p-4 font-bold text-white">{ret.passenger_name}</td>
                  <td className="p-4 font-medium text-slate-200">{ret.book_title}</td>
                  <td className="p-4 text-xs text-slate-300 font-semibold">{ret.return_library_name}</td>
                  <td className="p-4 text-xs font-mono text-slate-400">
                    {new Date(ret.return_date).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                        ret.condition === 'good'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : ret.condition === 'damaged'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {ret.condition}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400 italic">
                    {ret.remarks ? `"${ret.remarks}"` : '-'}
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
