import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, CheckCircle2, ShieldCheck, DollarSign, Search } from 'lucide-react';
import { adminAPI, returnAPI, rentalAPI, libraryAPI } from '../../services/api';

export default function AdminReturnsPage() {
  const [returnsList, setReturnsList] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Process Return Form State
  const [rentalIdentifier, setRentalIdentifier] = useState('');
  const [selectedRental, setSelectedRental] = useState(null);
  const [searchingRental, setSearchingRental] = useState(false);
  const [returnLibraryId, setReturnLibraryId] = useState('');
  const [condition, setCondition] = useState('good');
  const [lateFee, setLateFee] = useState(0);
  const [damageFee, setDamageFee] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processedSummary, setProcessedSummary] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [retRes, libRes] = await Promise.all([
        adminAPI.getReturns(),
        libraryAPI.getAllLibraries()
      ]);
      if (retRes.success) setReturnsList(retRes.data || []);
      if (libRes.success) {
        setLibraries(libRes.data || []);
        if (libRes.data?.length > 0) setReturnLibraryId(libRes.data[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch returns history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleLookupRental = async (e) => {
    e.preventDefault();
    if (!rentalIdentifier.trim()) return;
    setSearchingRental(true);
    setError('');
    setSelectedRental(null);
    setProcessedSummary(null);

    try {
      const res = await rentalAPI.getRentalById(rentalIdentifier.trim());
      if (res.success && res.data) {
        if (res.data.status !== 'rented') {
          setError(`Rental ${res.data.rental_code} has already been returned or cancelled (Status: ${res.data.status.toUpperCase()}).`);
        } else {
          setSelectedRental(res.data);
          setReturnLibraryId(res.data.destination_library_id || (libraries[0]?.id || ''));
        }
      } else {
        setError(`Rental not found for ID/Code: ${rentalIdentifier}`);
      }
    } catch (err) {
      setError(err.message || 'Rental lookup failed.');
    } finally {
      setSearchingRental(false);
    }
  };

  // Calculations for live Refund Summary
  const depositPaid = selectedRental ? Number(selectedRental.security_deposit || selectedRental.book_value || 500) : 500;
  const rentalFee = selectedRental ? Number(selectedRental.rental_fee || 50) : 50;
  const lateFeeNum = Math.max(0, Number(lateFee) || 0);
  const damageFeeNum = Math.max(0, Number(damageFee) || 0);

  let totalDeductions = 0;
  let finalRefund = 0;
  let refundStatusLabel = 'REFUNDED';

  if (condition === 'lost') {
    totalDeductions = depositPaid;
    finalRefund = 0;
    refundStatusLabel = 'NO_REFUND';
  } else {
    totalDeductions = rentalFee + lateFeeNum + damageFeeNum;
    finalRefund = Math.max(0, depositPaid - totalDeductions);
    if (finalRefund === 0) {
      refundStatusLabel = 'NO_REFUND';
    } else if (lateFeeNum > 0 || damageFeeNum > 0 || finalRefund < (depositPaid - rentalFee)) {
      refundStatusLabel = 'PARTIALLY_DEDUCTED';
    } else {
      refundStatusLabel = 'REFUNDED';
    }
  }

  const handleProcessReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRental) return;
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await returnAPI.processReturn({
        rental_id: selectedRental.id,
        return_library_id: Number(returnLibraryId),
        condition,
        late_fee: lateFeeNum,
        damage_fee: damageFeeNum,
        remarks
      });

      if (res.success && res.data) {
        setSuccessMsg(`Return processed for Rental ${selectedRental.rental_code}! Inventory updated and refund processed.`);
        setProcessedSummary(res.data.refund_summary || {
          security_deposit: depositPaid,
          rental_fee: rentalFee,
          late_fee: lateFeeNum,
          damage_fee: damageFeeNum,
          total_deduction: totalDeductions,
          refund_amount: finalRefund,
          refund_status: refundStatusLabel
        });
        setSelectedRental(null);
        fetchInitialData();
      } else {
        setError(res.message || 'Failed to process return.');
      }
    } catch (err) {
      setError(err.message || 'Return processing error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-emerald-400" /> Admin Return & Refund Processing
        </h1>
        <p className="text-sm text-slate-400">Process destination book check-ins, apply late/damage charges, and confirm deposit refunds.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Return Lookup & Processing Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Search className="h-5 w-5 text-indigo-400" /> Step 1: Search Rental by Code / ID
        </h2>

        <form onSubmit={handleLookupRental} className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Rental Code (e.g. TL-0001) or Rental ID..."
            value={rentalIdentifier}
            onChange={(e) => setRentalIdentifier(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
            required
          />
          <button
            type="submit"
            disabled={searchingRental}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all"
          >
            {searchingRental ? 'Searching...' : 'Lookup Rental'}
          </button>
        </form>

        {/* Selected Rental Form & Live Refund Summary */}
        {selectedRental && (
          <form onSubmit={handleProcessReturnSubmit} className="border-t border-slate-800 pt-6 space-y-6">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Rental Code:</span>
                <span className="font-bold text-amber-400">{selectedRental.rental_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Book Title:</span>
                <span className="font-bold text-white">{selectedRental.book_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Passenger:</span>
                <span className="text-slate-300">{selectedRental.user_name || selectedRental.passenger_name} ({selectedRental.user_email || selectedRental.passenger_email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup & Destination:</span>
                <span className="text-slate-300">{selectedRental.source_library_name} &rarr; {selectedRental.destination_library_name}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Return Library (Destination)
                  </label>
                  <select
                    value={returnLibraryId}
                    onChange={(e) => setReturnLibraryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {libraries.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Book Return Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="good">Good Condition (Standard Refund)</option>
                    <option value="damaged">Damaged (Deduct Damage Fee)</option>
                    <option value="lost">Lost / Missing (No Refund - Deposit Forfeited)</option>
                  </select>
                </div>

                {condition !== 'lost' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Late Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={lateFee}
                        onChange={(e) => setLateFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Damage Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={damageFee}
                        onChange={(e) => setDamageFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Remarks / Audit Notes
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Inspected at counter, minor cover wear..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Requirement 14 Live Refund Summary Box */}
              <div className="bg-slate-950 border border-emerald-500/30 p-5 rounded-2xl space-y-4 font-mono">
                <div className="border-b border-slate-800 pb-2 text-center text-xs font-bold text-emerald-400 tracking-wider">
                  --------------------------------<br />
                  REFUND SUMMARY<br />
                  --------------------------------
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Security Deposit Paid</span>
                    <span className="text-white font-semibold">₹{depositPaid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rental Fee</span>
                    <span className="text-rose-400 font-semibold">- ₹{rentalFee}</span>
                  </div>
                  {lateFeeNum > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Late Fee</span>
                      <span className="text-rose-400 font-semibold">- ₹{lateFeeNum}</span>
                    </div>
                  )}
                  {damageFeeNum > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Damage Charge</span>
                      <span className="text-rose-400 font-semibold">- ₹{damageFeeNum}</span>
                    </div>
                  )}
                  {condition === 'lost' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lost Book Forfeiture</span>
                      <span className="text-rose-400 font-semibold">- ₹{depositPaid}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold">
                    <span className="text-emerald-300">Final Refund</span>
                    <span className="text-emerald-400">₹{finalRefund}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refund Status:</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
                      {refundStatusLabel}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  {submitting ? 'Processing Return...' : 'Confirm Return & Process Refund'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Processed Return Summary Modal Card */}
        {processedSummary && (
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2 font-mono text-xs text-emerald-300">
            <div className="font-bold text-sm text-emerald-400 text-center">✓ Refund Processed Successfully</div>
            <div className="flex justify-between"><span>Security Deposit:</span><span>₹{processedSummary.security_deposit}</span></div>
            <div className="flex justify-between"><span>Total Deductions:</span><span>₹{processedSummary.total_deduction}</span></div>
            <div className="flex justify-between text-white font-bold"><span>Refund Amount:</span><span>₹{processedSummary.refund_amount}</span></div>
            <div className="flex justify-between"><span>Status:</span><span>{processedSummary.refund_status}</span></div>
          </div>
        )}
      </div>

      {/* Audit Returns Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6">
        <h2 className="text-lg font-bold text-white">Historical Return Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Return ID</th>
                <th className="p-4">Rental Code</th>
                <th className="p-4">Passenger</th>
                <th className="p-4">Book Title</th>
                <th className="p-4">Return Library</th>
                <th className="p-4">Return Date</th>
                <th className="p-4">Condition</th>
                <th className="p-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {returnsList.map((ret) => (
                <tr key={ret.return_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono text-slate-400 text-xs">#{ret.return_id}</td>
                  <td className="p-4 font-mono font-bold text-indigo-400">{ret.rental_code}</td>
                  <td className="p-4 font-bold text-white">{ret.passenger_name}</td>
                  <td className="p-4 font-medium text-slate-200">{ret.book_title}</td>
                  <td className="p-4 text-xs text-slate-300 font-semibold">{ret.return_library_name}</td>
                  <td className="p-4 text-xs font-mono text-slate-400">
                    {new Date(ret.return_date).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                        ret.condition === 'good'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : ret.condition === 'damaged'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {ret.condition}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400 italic">
                    {ret.remarks ? `"${ret.remarks}"` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
