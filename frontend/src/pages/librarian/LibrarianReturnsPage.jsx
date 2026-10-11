import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  BookOpen, 
  MapPin 
} from 'lucide-react';
import { librarianAPI } from '../../services/api';

export default function LibrarianReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await librarianAPI.getReturns({ search });
      if (res.success) {
        setReturns(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch pending returns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [search]);

  const handleProcessReturn = async (rentalId, rentalCode) => {
    if (!window.confirm(`Process return for rental code ${rentalCode}?`)) return;

    setProcessingId(rentalId);
    setSuccessMsg('');
    try {
      const res = await librarianAPI.processReturn(rentalId);
      if (res.success) {
        setSuccessMsg(res.message || `Book returned successfully!`);
        fetchReturns();
      } else {
        alert(res.message || 'Failed to process return.');
      }
    } catch (err) {
      alert(err.message || 'Error processing return.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-emerald-400" /> Book Return Desk
          </h1>
          <p className="text-sm text-slate-400">Process incoming book returns, inspect overdue loans, and automatically restore station stock.</p>
        </div>

        <button
          onClick={fetchReturns}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Refresh Returns List"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search pending returns by rental code, passenger name, or book title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Loading Pending Returns...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : returns.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="h-10 w-10 mx-auto opacity-40 text-emerald-400" />
            <p>No active pending returns for your station branch right now!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {returns.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all ${
                  item.is_overdue
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      {item.rental_code}
                    </span>
                    {item.is_overdue ? (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                        <AlertTriangle className="h-3 w-3" /> Overdue
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                        <Clock className="h-3 w-3 text-emerald-400" /> Pending Return
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base">{item.book_title}</h3>
                    <p className="text-xs text-slate-400">by {item.book_author}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Passenger:</span>
                      <span className="font-semibold text-white">{item.passenger_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Departed From:</span>
                      <span>{item.source_library_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Due Date:</span>
                      <span className={`font-bold ${item.is_overdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleProcessReturn(item.id, item.rental_code)}
                  disabled={processingId === item.id}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {processingId === item.id ? 'Processing...' : 'Confirm Book Return'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
