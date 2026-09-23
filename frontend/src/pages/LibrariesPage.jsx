import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Navigation, ArrowRight, Layers, ShieldAlert } from 'lucide-react';
import { libraryAPI, connectionAPI } from '../services/api';

export default function LibrariesPage() {
  const [libraries, setLibraries] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [libRes, connRes] = await Promise.all([
          libraryAPI.getAllLibraries(),
          connectionAPI.getAllConnections(),
        ]);
        if (libRes.success) setLibraries(libRes.data || []);
        if (connRes.success) setConnections(connRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch library network data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getConnectedDestinations = (libId) => {
    return connections
      .filter((c) => c.source_library_id === libId && c.active)
      .map((c) => ({
        id: c.destination_library_id,
        name: c.destination_name,
        city: c.destination_city,
      }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Travel Library Branches</h1>
        <p className="text-slate-400 text-sm">
          Physical book pickup and return locations stationed across major railway junctions and airport terminals.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Library Network...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto" />
          <p className="text-white font-semibold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {libraries.map((lib) => {
            const destinations = getConnectedDestinations(lib.id);
            return (
              <div
                key={lib.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {lib.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">City: <span className="text-white">{lib.city}</span></span>
                  </div>

                  <h3 className="text-xl font-bold text-white flex items-start gap-2">
                    <Building2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{lib.name}</span>
                  </h3>

                  <p className="text-xs text-slate-400 flex items-start gap-1.5 pt-1">
                    <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{lib.location}</span>
                  </p>

                  {/* Connected Destinations */}
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-indigo-400" /> Connected Return Dropoffs:
                    </div>
                    {destinations.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No connected routes currently configured.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {destinations.map((dest) => (
                          <span
                            key={dest.id}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 text-indigo-300 border border-slate-800 flex items-center gap-1"
                          >
                            <ArrowRight className="h-3 w-3 text-indigo-400" /> {dest.name} ({dest.city})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
