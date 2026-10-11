import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Train, Plane, Heart } from 'lucide-react';
import Mascot from './ui/Mascot';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-purple-100 bg-gradient-to-b from-transparent via-purple-50/50 to-purple-100/60 pt-16 pb-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand & Mascot */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold text-2xl text-slate-900 font-heading">
                Travel<span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Lib</span>
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md mb-6">
              The connected railway station & travel hub book rental network. Borrow your favorite books at your origin station and return them at your destination library.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-purple-200/80 text-xs font-bold text-purple-800 shadow-xs">
                <Train className="h-4 w-4 text-purple-600" /> Railway Stations
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-purple-200/80 text-xs font-bold text-purple-800 shadow-xs">
                <Plane className="h-4 w-4 text-indigo-600" /> Airport Terminals
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-slate-900 font-extrabold text-sm uppercase tracking-wider mb-4">
              Explore Network
            </h4>
            <ul className="space-y-3 text-sm text-slate-600 font-medium">
              <li>
                <Link to="/" className="hover:text-purple-700 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/books" className="hover:text-purple-700 transition-colors">
                  Browse Book Catalog
                </Link>
              </li>
              <li>
                <Link to="/libraries" className="hover:text-purple-700 transition-colors">
                  Station & Hub Libraries
                </Link>
              </li>
            </ul>
          </div>

          {/* Mascot Accent Box */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col items-center text-center border-purple-200/80">
            <Mascot type="main" size="sm" float speech="Happy Reading!" className="mb-2" />
            <div className="text-xs font-bold text-slate-900">Your Travel Reading Companion</div>
            <div className="text-[11px] text-slate-500 mt-1">Read. Travel. Return Anywhere.</div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 border-t border-purple-200/60 text-center text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
          <p>© 2026 Travel Library & Book Rental System. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-600">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for modern travelers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
