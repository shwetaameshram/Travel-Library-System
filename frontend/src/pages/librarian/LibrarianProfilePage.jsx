import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Shield, 
  RefreshCw, 
  Lock, 
  BookOpen, 
  Layers, 
  ShoppingBag 
} from 'lucide-react';
import { librarianAPI } from '../../services/api';

export default function LibrarianProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await librarianAPI.getProfile();
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load librarian profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const library = profile?.library || {};
  const librarian = profile?.librarian || {};
  const stats = profile?.stats || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <User className="h-6 w-6 text-emerald-400" /> Station Library & Profile Details
          </h1>
          <p className="text-sm text-slate-400">View your assigned railway station branch details, librarian credentials, and branch status.</p>
        </div>

        <button
          onClick={fetchProfile}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Refresh Profile"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
          <span>Loading Station Profile...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ASSIGNED LIBRARY BRANCH DETAILS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" /> Assigned Railway Library
              </h2>
              <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold">
                <Lock className="h-3 w-3" /> Managed by Admin
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Station Library Name</div>
                <div className="text-xl font-extrabold text-white mt-0.5">{library.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">City / Region</div>
                  <div className="font-bold text-slate-200 mt-0.5">{library.city}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Branch Type</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{library.type || 'Railway Station'}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Platform / Location</div>
                <div className="font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{library.location || 'Main Junction Railway Station'}</span>
                </div>
              </div>
            </div>

            {/* Branch Summary Metrics */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-xs font-semibold">Catalog</div>
                <div className="text-lg font-black text-white mt-1">{stats.total_books}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-xs font-semibold">Copies</div>
                <div className="text-lg font-black text-emerald-400 mt-1">{stats.total_copies}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-xs font-semibold">Active Loans</div>
                <div className="text-lg font-black text-amber-400 mt-1">{stats.active_rentals}</div>
              </div>
            </div>
          </div>

          {/* LIBRARIAN CREDENTIALS & ACCOUNT */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" /> Librarian Profile
              </h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {librarian.role || 'librarian'}
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">
                {librarian.name?.charAt(0)?.toUpperCase() || 'L'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{librarian.name}</h3>
                <p className="text-xs text-slate-400">Station Head Librarian</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <Mail className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-bold">Email Address</div>
                  <div className="font-medium text-slate-200">{librarian.email}</div>
                </div>
              </div>

              {librarian.mobile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Phone className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-bold">Mobile Phone</div>
                    <div className="font-medium text-slate-200">{librarian.mobile}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <Shield className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-bold">Account Security</div>
                  <div className="font-medium text-emerald-400 flex items-center gap-1.5">
                    <span>Active & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
