import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Navigation, ArrowRight, Layers, ShieldAlert, Train } from 'lucide-react';
import { libraryAPI, connectionAPI } from '../services/api';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import SectionHeading from '../components/ui/SectionHeading';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <SectionHeading
        badge="Station & Airport Hubs"
        title="Travel Library Network Branches"
        subtitle="Physical book pickup and dropoff branches located across major railway junctions and airport terminals."
        align="left"
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4 font-medium">
          <Mascot type="main" size="md" float speech="Locating Station Hubs..." />
          <div className="flex items-center gap-2 text-sm font-bold text-[#6D28D9]">
            <div className="h-4 w-4 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />
            <span>Loading Station Network...</span>
          </div>
        </div>
      ) : error ? (
        <GlassCard className="p-8 bg-rose-50 border-rose-200 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 text-rose-600 mx-auto" />
          <p className="text-rose-900 font-extrabold">{error}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {libraries.map((lib) => {
            const destinations = getConnectedDestinations(lib.id);
            return (
              <GlassCard hover key={lib.id} className="flex flex-col justify-between space-y-5 border-purple-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-[#6D28D9] border border-purple-200">
                      {lib.type || 'Station Hub'}
                    </span>
                    <span className="text-xs font-bold text-[#4B5563]">
                      City: <span className="text-[#24104F] font-black">{lib.city}</span>
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Train className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#24104F] leading-snug">
                        {lib.name}
                      </h3>
                      <p className="text-xs text-[#4B5563] font-bold flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#6D28D9] shrink-0" />
                        <span>{lib.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Connected Destinations */}
                  <div className="pt-4 border-t border-purple-100 space-y-2.5">
                    <div className="text-xs font-black uppercase tracking-wider text-[#4B5563] flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5 text-[#6D28D9]" /> Connected Return Dropoffs:
                    </div>
                    {destinations.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium italic">No connected routes currently configured.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {destinations.map((dest) => (
                          <span
                            key={dest.id}
                            className="text-xs px-3 py-1 rounded-xl bg-purple-50 text-[#24104F] border border-purple-200 flex items-center gap-1 font-black shadow-2xs"
                          >
                            <ArrowRight className="h-3 w-3 text-[#6D28D9]" /> {dest.name} ({dest.city})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
