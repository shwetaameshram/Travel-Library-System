import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, AlertCircle, CheckCircle2, X, Building2, BookOpen } from 'lucide-react';
import { adminAPI } from '../../services/api';

export default function AdminStockPage() {
  const [stock, setStock] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    library_id: '',
    book_id: '',
    quantity: 5,
    available_quantity: 5,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockRes, libRes, bookRes] = await Promise.all([
        adminAPI.getStock(),
        adminAPI.getLibraries(),
        adminAPI.getBooks(),
      ]);

      if (stockRes.success) setStock(stockRes.data || []);
      if (libRes.success) setLibraries(libRes.data || []);
      if (bookRes.success) setBooks(bookRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory stock.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData({
        library_id: item.library_id,
        book_id: item.book_id,
        quantity: item.quantity,
        available_quantity: item.available_quantity,
      });
    } else {
      setFormData({
        library_id: libraries[0]?.id || '',
        book_id: books[0]?.id || '',
        quantity: 5,
        available_quantity: 5,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (Number(formData.available_quantity) > Number(formData.quantity)) {
      setError('Available quantity cannot exceed total quantity.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await adminAPI.addOrUpdateStock(formData);
      if (res.success) {
        setSuccess('Library book stock updated successfully.');
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Manage Library Book Stock</h1>
          <p className="text-sm text-slate-400">Manage real-time book copies and availability per station/airport branch.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add / Update Branch Stock
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

      {/* Stock Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Library Branch</th>
                <th className="p-4">City</th>
                <th className="p-4">Book Title</th>
                <th className="p-4">Author</th>
                <th className="p-4">Total Copies</th>
                <th className="p-4">Available</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stock.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    {item.library_name}
                  </td>
                  <td className="p-4 text-slate-400">{item.library_city}</td>
                  <td className="p-4 font-medium text-slate-200">{item.book_title}</td>
                  <td className="p-4 text-slate-400 text-xs">{item.book_author}</td>
                  <td className="p-4 font-semibold text-slate-200">{item.quantity}</td>
                  <td className="p-4 font-bold text-emerald-400">{item.available_quantity}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors cursor-pointer"
                      title="Update Stock"
                    >
                      <Edit2 className="h-4 w-4" />
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
              <h2 className="text-xl font-bold text-white">Add / Update Branch Stock</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Select Library Branch</label>
                <select
                  value={formData.library_id}
                  onChange={(e) => setFormData({ ...formData, library_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {libraries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Select Book</label>
                <select
                  value={formData.book_id}
                  onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.author})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Available Quantity</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.available_quantity}
                    onChange={(e) => setFormData({ ...formData, available_quantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
                >
                  {submitting ? 'Saving...' : 'Save Stock Record'}
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
