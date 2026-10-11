import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Eye, 
  ShoppingBag, 
  Mail, 
  Phone, 
  Calendar, 
  X, 
  CheckCircle2, 
  BookOpen 
} from 'lucide-react';
import { librarianAPI } from '../../services/api';

export default function LibrarianPassengersPage() {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [passengerDetails, setPassengerDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchPassengers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await librarianAPI.getPassengers({ search });
      if (res.success) {
        setPassengers(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch branch passengers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassengers();
  }, [search]);

  const handleOpenDetails = async (p) => {
    setSelectedPassenger(p);
    setModalLoading(true);
    try {
      const res = await librarianAPI.getPassengerDetails(p.id);
      if (res.success) {
        setPassengerDetails(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch passenger rental history.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-400" /> Station Passengers & Readers
          </h1>
          <p className="text-sm text-slate-400">View passengers connected to your station library branch and inspect their loan histories.</p>
        </div>

        <button
          onClick={fetchPassengers}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Refresh Passengers"
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
            placeholder="Search passengers by name, email, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Passengers Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Loading Station Passengers...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : passengers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Users className="h-10 w-10 mx-auto opacity-40 text-slate-400" />
            <p>No passengers found connected to your station branch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Passenger Name</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5 text-center">Branch Rentals</th>
                  <th className="p-3.5 text-center">Active Loans</th>
                  <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {passengers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{p.name}</div>
                        <div className="text-xs text-slate-500 font-normal">Member since {new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-400 space-y-0.5">
                      <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-500" /> {p.email}</div>
                      {p.mobile && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-500" /> {p.mobile}</div>}
                    </td>
                    <td className="p-3.5 text-center font-extrabold text-white">
                      {p.branch_rentals_count || 0}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.active_rentals_count || 0} active
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenDetails(p)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer ml-auto"
                      >
                        <Eye className="h-3.5 w-3.5" /> History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PASSENGER DETAILS & RENTAL HISTORY MODAL */}
      {selectedPassenger && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  {selectedPassenger.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPassenger.name}</h3>
                  <p className="text-xs text-slate-400">{selectedPassenger.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPassenger(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
                <span>Fetching Rental History...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Branch Rental History ({passengerDetails?.rentals?.length || 0})
                </h4>

                {passengerDetails?.rentals?.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    No rental history recorded at this branch for this passenger.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {passengerDetails?.rentals?.map((rental) => (
                      <div key={rental.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-mono text-emerald-400 font-bold">{rental.rental_code}</div>
                          <div className="font-bold text-white text-sm">{rental.book_title}</div>
                          <div className="text-slate-400">Route: {rental.source_library_name} → {rental.destination_library_name}</div>
                        </div>

                        <div className="text-right space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            rental.status === 'returned'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {rental.status}
                          </span>
                          <div className="text-slate-500">Rented: {new Date(rental.rental_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
