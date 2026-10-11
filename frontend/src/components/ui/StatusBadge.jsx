import React from 'react';

export default function StatusBadge({ status = 'active' }) {
  const normalized = String(status).toLowerCase();

  const styles = {
    rented: 'bg-indigo-100 text-indigo-800 border-indigo-200/80',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
    available: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
    returned: 'bg-slate-100 text-slate-700 border-slate-200/80',
    completed: 'bg-slate-100 text-slate-700 border-slate-200/80',
    overdue: 'bg-rose-100 text-rose-800 border-rose-200/80',
    pending: 'bg-amber-100 text-amber-800 border-amber-200/80',
    out_of_stock: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const labels = {
    rented: 'RENTED',
    active: 'ACTIVE',
    available: 'AVAILABLE',
    returned: 'RETURNED',
    completed: 'COMPLETED',
    overdue: 'OVERDUE',
    pending: 'PENDING',
    out_of_stock: 'OUT OF STOCK'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-sm ${styles[normalized] || styles.active}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {labels[normalized] || String(status).toUpperCase()}
    </span>
  );
}
