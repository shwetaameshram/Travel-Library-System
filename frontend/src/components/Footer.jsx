import React from 'react';
import { BookOpen, Train, Plane, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-900/60 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white">TravelLib</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connected station & airport book rental service for modern travelers. Borrow at your origin and return at your destination.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/" className="hover:text-indigo-400 transition-colors">Home Page</a></li>
              <li><a href="/books" className="hover:text-indigo-400 transition-colors">Browse Book Catalog</a></li>
              <li><a href="/libraries" className="hover:text-indigo-400 transition-colors">Station & Airport Libraries</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Supported Transport Hubs</h4>
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                <Train className="h-3.5 w-3.5 text-indigo-400" /> Railway Stations
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                <Plane className="h-3.5 w-3.5 text-violet-400" /> Airport Terminals
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 text-center text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Travel Library & Book Rental System.</p>
          <p>Built with React, Vite, Node.js Express, and MySQL.</p>
        </div>
      </div>
    </footer>
  );
}
