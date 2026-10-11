import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  MapPin, 
  BookOpen, 
  CheckCircle2, 
  Star 
} from 'lucide-react';
import { librarianAPI } from '../../services/api';

export default function LibrarianLibrariesPage() {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchLibraries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await librarianAPI.getConnectedLibraries({ search });
      if (res.success) {
        setLibraries(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch connected library network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, [search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-400" /> Connected Railway Libraries Network
          </h1>
          <p className="text-sm text-slate-400">Inspect partner station libraries across the railway network and check cross-branch stock availability.</p>
        </div>

        <button
          onClick={fetchLibraries}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Refresh Network"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search connected library branches by station name, city, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Libraries Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Loading Library Branches...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : libraries.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Building2 className="h-10 w-10 mx-auto opacity-40 text-slate-400" />
            <p>No connected library branches found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {libraries.map((lib) => (
              <div
                key={lib.id}
                className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all ${
                  lib.is_my_branch
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                      {lib.type || 'Railway Station'}
                    </span>
                    {lib.is_my_branch && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <Star className="h-3 w-3 fill-emerald-400" /> My Station Branch
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base">{lib.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{lib.location || lib.city}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-500">Total Books</div>
                    <div className="font-bold text-white text-sm">{lib.total_books} copies</div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-500">Available</div>
                    <div className="font-bold text-emerald-400 text-sm">{lib.available_copies} copies</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
