import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Edit3, 
  RefreshCw, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  BookOpen, 
  ShoppingBag 
} from 'lucide-react';
import { librarianAPI } from '../../services/api';

export default function LibrarianStockPage() {
  const [stock, setStock] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [formData, setFormData] = useState({
    book_id: '',
    quantity: 1,
    available_quantity: 1
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStock = async () => {
    setLoading(true);
    setError('');
    try {
      const [stockRes, booksRes] = await Promise.all([
        librarianAPI.getStock({ search }),
        librarianAPI.getBooks()
      ]);
      if (stockRes.success) {
        setStock(stockRes.data || []);
      }
      if (booksRes.success) {
        setBooks(booksRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load branch book stock.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [search]);

  const totalCopies = stock.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const availableCopies = stock.reduce((acc, item) => acc + Number(item.available_quantity || 0), 0);
  const rentedCopies = stock.reduce((acc, item) => acc + Number(item.rented_quantity || 0), 0);

  const handleOpenAdd = () => {
    setFormData({
      book_id: books[0]?.id || '',
      quantity: 5,
      available_quantity: 5
    });
    setModalError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedStock(item);
    setFormData({
      book_id: item.book_id,
      quantity: item.quantity,
      available_quantity: item.available_quantity
    });
    setModalError('');
    setShowEditModal(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      const res = await librarianAPI.addOrUpdateStock(formData);
      if (res.success) {
        setShowAddModal(false);
        fetchStock();
      } else {
        setModalError(res.message || 'Failed to add stock.');
      }
    } catch (err) {
      setModalError(err.message || 'Error updating stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      const res = await librarianAPI.addOrUpdateStock(formData);
      if (res.success) {
        setShowEditModal(false);
        fetchStock();
      } else {
        setModalError(res.message || 'Failed to update stock.');
      }
    } catch (err) {
      setModalError(err.message || 'Error updating stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-400" /> Station Book Stock Inventory
          </h1>
          <p className="text-sm text-slate-400">Manage copies and real-time book availability for your assigned library branch.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStock}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add / Adjust Stock
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Total Stock Copies</div>
            <div className="text-3xl font-black text-white mt-1">{totalCopies}</div>
          </div>
          <BookOpen className="h-8 w-8 text-emerald-400/40" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Available Copies</div>
            <div className="text-3xl font-black text-emerald-400 mt-1">{availableCopies}</div>
          </div>
          <CheckCircle2 className="h-8 w-8 text-emerald-400/40" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Currently Rented</div>
            <div className="text-3xl font-black text-amber-400 mt-1">{rentedCopies}</div>
          </div>
          <ShoppingBag className="h-8 w-8 text-amber-400/40" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search stock by book title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Loading Inventory Stock...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        ) : stock.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Layers className="h-10 w-10 mx-auto opacity-40 text-slate-400" />
            <p>No book stock inventory records found for your station branch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 rounded-l-xl">Book Title & Author</th>
                  <th className="p-3.5">ISBN & Genre</th>
                  <th className="p-3.5 text-center">Total Quantity</th>
                  <th className="p-3.5 text-center">Available Copies</th>
                  <th className="p-3.5 text-center">Rented Copies</th>
                  <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stock.map((item) => (
                  <tr key={item.stock_id || item.book_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      <div>{item.title}</div>
                      <div className="text-xs text-slate-400 font-normal">{item.author}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono text-xs text-indigo-400">{item.isbn || 'N/A'}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                        {item.genre}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-extrabold text-white">
                      {item.quantity}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.available_quantity} available
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-amber-400">
                      {item.rented_quantity}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Update Stock Quantities"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD STOCK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" /> Add Book Stock
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

            <form onSubmit={handleSubmitAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Book</label>
                <select
                  required
                  value={formData.book_id}
                  onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Catalog Book...</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.author})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Available Copies</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.quantity}
                    required
                    value={formData.available_quantity}
                    onChange={(e) => setFormData({ ...formData, available_quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STOCK MODAL */}
      {showEditModal && selectedStock && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-emerald-400" /> Update Stock: {selectedStock.title}
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

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Available Copies</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.quantity}
                    required
                    value={formData.available_quantity}
                    onChange={(e) => setFormData({ ...formData, available_quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
