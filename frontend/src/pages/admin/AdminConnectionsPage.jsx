import React, { useState, useEffect } from 'react';
import { GitCommit, Plus, Trash2, AlertCircle, CheckCircle2, X, ArrowRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function AdminConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ source_library_id: '', destination_library_id: '', active: true });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [connRes, libRes] = await Promise.all([
        adminAPI.getConnections(),
        adminAPI.getLibraries(),
      ]);

      if (connRes.success) setConnections(connRes.data || []);
      if (libRes.success) setLibraries(libRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch library connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    const srcId = libraries[0]?.id || '';
    const destId = libraries[1]?.id || libraries[0]?.id || '';
    setFormData({ source_library_id: srcId, destination_library_id: destId, active: true });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (Number(formData.source_library_id) === Number(formData.destination_library_id)) {
      setError('Source and destination libraries cannot be the same.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await adminAPI.createConnection(formData);
      if (res.success) {
        setSuccess('New travel connection route added successfully.');
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    setError('');
    setSuccess('');
    try {
      const res = await adminAPI.updateConnection(id, { active: !currentActive });
      if (res.success) {
        setSuccess('Connection status updated.');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Toggle failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this travel connection route?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await adminAPI.deleteConnection(id);
      if (res.success) {
        setSuccess('Connection deleted.');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Manage Library Route Connections</h1>
          <p className="text-sm text-slate-400">Configure origin and destination travel routes available for book borrowing.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Travel Route
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Connections List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Origin Library (Source)</th>
                <th className="p-4">Route</th>
                <th className="p-4">Destination Library (Return)</th>
                <th className="p-4">Active Route Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {connections.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white">
                    {c.source_name} <span className="text-xs text-slate-400 font-normal">({c.source_city})</span>
                  </td>
                  <td className="p-4 text-teal-400">
                    <ArrowRight className="h-4 w-4" />
                  </td>
                  <td className="p-4 font-bold text-white">
                    {c.destination_name} <span className="text-xs text-slate-400 font-normal">({c.destination_city})</span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(c.id, c.active)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        c.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {c.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      <span>{c.active ? 'ACTIVE' : 'INACTIVE'}</span>
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Route"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Add Travel Connection Route</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Source Library (Pickup)</label>
                <select
                  value={formData.source_library_id}
                  onChange={(e) => setFormData({ ...formData, source_library_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-500"
                >
                  {libraries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Destination Library (Dropoff)</label>
                <select
                  value={formData.destination_library_id}
                  onChange={(e) => setFormData({ ...formData, destination_library_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-teal-500"
                >
                  {libraries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-md shadow-teal-600/20"
                >
                  {submitting ? 'Creating...' : 'Create Route'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
