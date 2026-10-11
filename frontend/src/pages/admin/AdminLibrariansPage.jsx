import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Edit3, 
  Building2, 
  Power, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  X, 
  Check, 
  BookOpen, 
  ShieldCheck 
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function AdminLibrariansPage() {
  const [librarians, setLibrarians] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [libraryFilter, setLibraryFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLibrarian, setSelectedLibrarian] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    library_id: '',
    status: 'active'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [libRes, librariesRes] = await Promise.all([
        adminAPI.getLibrarians({ search, status: statusFilter, library_id: libraryFilter }),
        adminAPI.getLibraries()
      ]);

      if (libRes.success) {
        setLibrarians(libRes.data || []);
      }
      if (librariesRes.success) {
        setLibraries(librariesRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load librarians data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, libraryFilter]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      mobile: '',
      library_id: libraries[0]?.id || '',
      status: 'active'
    });
    setModalError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (librarian) => {
    setSelectedLibrarian(librarian);
    setFormData({
      name: librarian.name,
      email: librarian.email,
      password: '', // blank unless updating
      mobile: librarian.mobile || '',
      library_id: librarian.library_id || '',
      status: librarian.status || 'active'
    });
    setModalError('');
    setShowEditModal(true);
  };

  const handleOpenAssign = (librarian) => {
    setSelectedLibrarian(librarian);
    setFormData((prev) => ({ ...prev, library_id: librarian.library_id || '' }));
    setModalError('');
    setShowAssignModal(true);
  };

  const handleOpenDetails = (librarian) => {
    setSelectedLibrarian(librarian);
    setShowDetailsModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      const res = await adminAPI.createLibrarian(formData);
      if (res.success) {
        setShowAddModal(false);
        fetchData();
      } else {
        setModalError(res.message || 'Failed to create librarian account.');
      }
    } catch (err) {
      setModalError(err.message || 'Error connecting to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLibrarian) return;
    setSubmitting(true);
    setModalError('');
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      const res = await adminAPI.updateLibrarian(selectedLibrarian.id, payload);
      if (res.success) {
        setShowEditModal(false);
        fetchData();
      } else {
        setModalError(res.message || 'Failed to update librarian account.');
      }
    } catch (err) {
      setModalError(err.message || 'Error updating librarian.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLibrarian || !formData.library_id) return;
    setSubmitting(true);
    setModalError('');
    try {
      const res = await adminAPI.updateLibrarianLibrary(selectedLibrarian.id, formData.library_id);
      if (res.success) {
        setShowAssignModal(false);
        fetchData();
      } else {
        setModalError(res.message || 'Failed to assign library.');
      }
    } catch (err) {
      setModalError(err.message || 'Error assigning library.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (librarian) => {
    const newStatus = librarian.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await adminAPI.updateLibrarianStatus(librarian.id, newStatus);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-rose-500" /> Librarian Management
          </h1>
          <p className="text-sm text-slate-400">Manage station librarians, account statuses, and branch library assignments.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer w-fit"
        >
          <Plus className="h-4 w-4" /> Add Librarian
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search librarian by name, email, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-rose-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <select
          value={libraryFilter}
          onChange={(e) => setLibraryFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-rose-500"
        >
          <option value="">All Libraries</option>
          {libraries.map((lib) => (
            <option key={lib.id} value={lib.id}>
              {lib.name} ({lib.city})
            </option>
          ))}
        </select>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-rose-500" />
            <span>Loading Librarians...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : librarians.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <UserCheck className="h-10 w-10 mx-auto opacity-40 text-slate-400" />
            <p>No librarians found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Librarian Name</th>
                  <th className="p-3.5">Email & Mobile</th>
                  <th className="p-3.5">Assigned Library</th>
                  <th className="p-3.5 text-center">Active Rentals</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {librarians.map((lib) => (
                  <tr key={lib.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      <div>{lib.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">ID: {lib.id}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{lib.email}</div>
                      <div className="text-xs text-slate-400">{lib.mobile || 'N/A'}</div>
                    </td>
                    <td className="p-3.5">
                      {lib.library_name ? (
                        <div>
                          <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0" /> {lib.library_name}
                          </div>
                          <div className="text-xs text-slate-400">{lib.library_city}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-400 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {lib.active_rentals || 0} active
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${
                          lib.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {lib.status || 'active'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenDetails(lib)}
                        title="View Details"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(lib)}
                        title="Edit Librarian"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenAssign(lib)}
                        title="Assign Library"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
                      >
                        <Building2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(lib)}
                        title={lib.status === 'active' ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          lib.status === 'active'
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD LIBRARIAN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-rose-500" /> Create Librarian Account
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Librarian Chandrapur"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="librarian@travellib.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 555-0192"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Railway Library</label>
                <select
                  required
                  value={formData.library_id}
                  onChange={(e) => setFormData({ ...formData, library_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">Select Library Branch...</option>
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.name} ({lib.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Librarian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LIBRARIAN MODAL */}
      {showEditModal && selectedLibrarian && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-400" /> Edit Librarian Details
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">New Password (optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Railway Library</label>
                <select
                  required
                  value={formData.library_id}
                  onChange={(e) => setFormData({ ...formData, library_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">Select Library Branch...</option>
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.name} ({lib.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN LIBRARY MODAL */}
      {showAssignModal && selectedLibrarian && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-400" /> Assign Railway Library
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Reassigning <span className="text-white font-bold">{selectedLibrarian.name}</span> will instantly update their dashboard access scope.
            </p>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select New Library Branch</label>
                <select
                  required
                  value={formData.library_id}
                  onChange={(e) => setFormData({ ...formData, library_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Branch...</option>
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.name} ({lib.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Assign Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedLibrarian && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" /> Librarian Profile
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Name:</span>
                <span className="font-bold text-white text-sm">{selectedLibrarian.name}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-indigo-400">{selectedLibrarian.email}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Mobile:</span>
                <span>{selectedLibrarian.mobile || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Assigned Branch:</span>
                <span className="font-bold text-rose-400">{selectedLibrarian.library_name || 'Unassigned'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Branch Active Rentals:</span>
                <span className="font-extrabold text-amber-400">{selectedLibrarian.active_rentals || 0} active</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className="uppercase font-bold text-emerald-400">{selectedLibrarian.status}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
