import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function LibrarianFeaturePlaceholder() {
  const location = useLocation();
  const title = location.pathname.split('/').pop().replace('-', ' ').toUpperCase();

  return (
    <div className="max-w-2xl mx-auto py-16 text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
      <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
        <Construction className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-extrabold text-white">{title} Module</h1>
      <p className="text-slate-400 text-sm max-w-md mx-auto">
        The Librarian Authentication & Dashboard Foundation is currently active. Full management views for this feature will be implemented in the next module step.
      </p>
      <Link
        to="/librarian/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Librarian Dashboard
      </Link>
    </div>
  );
}
