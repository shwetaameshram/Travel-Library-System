import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  MapPin, 
  ArrowRight, 
  Compass, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Navigation,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';
import { libraryAPI, connectionAPI } from '../services/api';

export default function HomePage() {
  const [libraries, setLibraries] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [libRes, connRes] = await Promise.all([
          libraryAPI.getAllLibraries(),
          connectionAPI.getAllConnections(),
        ]);
        if (libRes.success) setLibraries(libRes.data.slice(0, 4));
        if (connRes.success) setConnections(connRes.data.slice(0, 4));
      } catch (err) {
        console.error('Failed loading homepage travel connections:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const featureCards = [
    {
      title: '1. Search & Rent',
      desc: 'Browse hundreds of popular books at your departure station or airport terminal.',
      icon: Search,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20',
    },
    {
      title: '2. Travel With Your Book',
      desc: 'Enjoy immersive reading during your train ride, flight, or transit journey.',
      icon: Compass,
      color: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20',
    },
    {
      title: '3. Return at Destination',
      desc: 'Simply drop off your borrowed book at any connected arrival library branch.',
      icon: RefreshCcw,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest shadow-inner">
            <Sparkles className="h-4 w-4" /> Next-Gen Travel Rental System
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">Library</span>
            </h1>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-200">
              Read Anywhere. Return Anywhere.
            </p>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Borrow books at your departure railway station or airport concourse and return them seamlessly at your travel destination branch.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/books"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <BookOpen className="h-5 w-5" /> Browse Books Catalog
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base transition-all flex items-center gap-2"
            >
              <ShieldCheck className="h-5 w-5 text-indigo-400" /> Account Login
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Main Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Why Use Travel Library?</h2>
          <p className="text-slate-400 text-sm">Designed specifically for passengers, commuters, and long-distance travellers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`p-8 rounded-3xl bg-gradient-to-br ${card.color} border backdrop-blur-md space-y-4 shadow-xl hover:scale-[1.02] transition-transform`}
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">{card.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-slate-900/50 border border-slate-800/80 rounded-3xl">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Simple 3-Step Process</span>
          <h2 className="text-3xl font-extrabold text-white">How Travel Library Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="space-y-3 text-center p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="h-12 w-12 rounded-full bg-indigo-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
              1
            </div>
            <h4 className="text-lg font-bold text-white">Find a Book</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Search available book copies at your departure station (e.g. Chandrapur, Nagpur, Mumbai).
            </p>
          </div>

          <div className="space-y-3 text-center p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="h-12 w-12 rounded-full bg-purple-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-purple-600/20">
              2
            </div>
            <h4 className="text-lg font-bold text-white">Rent While Travelling</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Book your rental online and pick up your copy at the terminal library branch before boarding.
            </p>
          </div>

          <div className="space-y-3 text-center p-6 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="h-12 w-12 rounded-full bg-emerald-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
              3
            </div>
            <h4 className="text-lg font-bold text-white">Return at Destination</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drop off the book at your arrival station or airport library branch when your travel ends.
            </p>
          </div>
        </div>
      </section>

      {/* Connected Libraries Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Navigation className="h-6 w-6 text-indigo-400" /> Connected Travel Network
            </h2>
            <p className="text-slate-400 text-sm">Station & Airport Library branches connected for cross-return borrowing.</p>
          </div>
          <Link
            to="/libraries"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
          >
            View All Branches <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {libraries.map((lib) => (
            <div key={lib.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {lib.type}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{lib.city}</span>
              </div>
              <h3 className="font-bold text-white text-base leading-snug">{lib.name}</h3>
              <p className="text-xs text-slate-400 flex items-start gap-1">
                <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="truncate">{lib.location}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
