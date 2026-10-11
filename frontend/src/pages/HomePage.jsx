import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  MapPin, 
  ArrowRight, 
  Compass, 
  Sparkles, 
  Train, 
  ShieldCheck, 
  RefreshCcw,
  Plane,
  Send,
  Navigation
} from 'lucide-react';
import { libraryAPI, connectionAPI, bookAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import SectionHeading from '../components/ui/SectionHeading';
import BookCard from '../components/ui/BookCard';
import LibraryCard from '../components/ui/LibraryCard';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [libraries, setLibraries] = useState([]);
  const [connections, setConnections] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [libRes, connRes, bookRes] = await Promise.all([
          libraryAPI.getAllLibraries(),
          connectionAPI.getAllConnections(),
          bookAPI.getAllBooks().catch(() => ({ success: false, data: [] }))
        ]);
        if (libRes.success) setLibraries(libRes.data.slice(0, 4));
        if (connRes.success) setConnections(connRes.data.slice(0, 4));
        if (bookRes.success && Array.isArray(bookRes.data)) {
          setFeaturedBooks(bookRes.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed loading homepage travel connections:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Choose a Book',
      desc: 'Find a book you want to read from our station catalog.',
      icon: BookOpen,
      gradient: 'from-purple-600 to-indigo-700'
    },
    {
      step: '02',
      title: 'Select Your Route',
      desc: 'Choose your source departure and destination dropoff libraries.',
      icon: Navigation,
      gradient: 'from-indigo-700 to-blue-700'
    },
    {
      step: '03',
      title: 'Start Your Journey',
      desc: 'Reserve the book and take it with you on your travel journey.',
      icon: Train,
      gradient: 'from-blue-700 to-purple-700'
    },
    {
      step: '04',
      title: 'Return & Complete',
      desc: 'Return the book at your destination library branch desk.',
      icon: RefreshCcw,
      gradient: 'from-emerald-600 to-teal-700'
    }
  ];

  return (
    <div className="space-y-24 pb-20 bg-ambient-mesh">
      {/* Hero Section (Seamless Artwork Background Blending) */}
      <section 
        className="relative pt-10 md:pt-16 pb-16 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f7f5ff 0%, #eef0ff 45%, #f8f7ff 100%)'
        }}
      >
        {/* Ambient Glow Orbs */}
        <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-purple-300/35 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-indigo-300/35 rounded-full blur-3xl -z-10 animate-pulse"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* LEFT: Headline & Hero Content */}
            <div className="lg:col-span-6 space-y-6 text-left relative z-10">
              {/* Handwritten Accent Note */}
              <div className="text-[#6D28D9] font-black text-xs sm:text-sm tracking-wide uppercase flex items-center gap-1.5">
                <span>Books + Trains = Better Journeys</span>
                <span className="text-rose-500">♡</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-6xl font-black text-[#24104F] tracking-tight leading-[1.08]">
                  READ. <span className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 bg-clip-text text-transparent">TRAVEL.</span> RETURN.
                </h1>
                <p className="text-xl sm:text-2xl font-black text-[#3B2568] leading-snug">
                  Borrow a book at your starting station and return it at your destination.
                </p>
                <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed max-w-lg font-medium">
                  Designed for commuters, railway passengers, and airport travelers. Enjoy seamless reading across connected transportation hubs.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/books">
                  <PrimaryButton variant="primary">
                    <BookOpen className="w-5 h-5" />
                    <span>Explore Books</span>
                  </PrimaryButton>
                </Link>

                <Link to="/libraries">
                  <PrimaryButton variant="secondary">
                    <MapPin className="w-5 h-5 text-purple-700" />
                    <span>Find Libraries</span>
                  </PrimaryButton>
                </Link>
              </div>

              {/* Quick Travel Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#4B5563] font-extrabold border-t border-purple-200/80">
                <div className="flex items-center gap-2">
                  <Train className="w-4 h-4 text-purple-700" />
                  <span>50+ Railway Hubs</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Instant Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-indigo-700" />
                  <span>Deposit Refunded</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Seamless Travel Illustration (No White Card Box) */}
            <div className="lg:col-span-6 relative flex flex-col justify-center items-center">
              
              {/* Main Artwork Container with Edge Fading Radial Mask */}
              <div className="relative w-full max-w-lg mx-auto flex justify-center items-center">
                <img
                  src="/images/hero/travel_hero.png"
                  alt="Travel Library Journey"
                  className="w-full h-auto object-cover rounded-3xl shadow-2xl transition-transform duration-700 hover:scale-[1.01]"
                  style={{
                    maskImage: 'radial-gradient(circle at center, black 65%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 100%)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                {/* Floating Glass Badges Layered Over Artwork */}
                {/* Badge 1: Top Right (100+ Books) */}
                <div className="absolute top-2 right-0 sm:right-2 z-20 animate-float-slow">
                  <div className="glass-panel px-4 py-2.5 rounded-2xl shadow-xl border border-white/80 bg-white/80 backdrop-blur-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-xs shadow-md">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#24104F]">100+ Books</div>
                      <div className="text-[10px] font-bold text-[#6B7280]">Ready to explore</div>
                    </div>
                  </div>
                </div>

                {/* Badge 2: Middle Right (Connected Libraries) */}
                <div className="absolute top-1/2 -right-2 sm:-right-6 z-20 -translate-y-1/2 animate-float">
                  <div className="glass-panel px-4 py-2.5 rounded-2xl shadow-xl border border-white/80 bg-white/80 backdrop-blur-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-md">
                      <Train className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#24104F]">Connected Libraries</div>
                      <div className="text-[10px] font-bold text-[#6B7280]">Borrow & return anywhere</div>
                    </div>
                  </div>
                </div>

                {/* Badge 3: Bottom Left (Easy Returns) */}
                <div className="absolute -bottom-2 left-0 sm:left-2 z-20 animate-float-slow">
                  <div className="glass-panel px-4 py-2.5 rounded-2xl shadow-xl border border-white/80 bg-white/80 backdrop-blur-xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                      <RefreshCcw className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#24104F]">Easy Returns</div>
                      <div className="text-[10px] font-bold text-[#6B7280]">Return at destination</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Journey Route Pill (Mumbai -> Train -> Nagpur) */}
              <div className="mt-6 z-20 flex justify-center w-full">
                <div className="glass-pill px-5 py-2.5 rounded-full border border-purple-200 bg-white/90 backdrop-blur-xl shadow-md flex items-center gap-3 text-xs font-black text-[#24104F]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Mumbai
                  </span>
                  <span className="text-[#6D28D9] font-bold">→</span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 text-[#6D28D9] flex items-center gap-1.5 text-[11px]">
                    <Train className="w-3.5 h-3.5 animate-bounce" /> Express Route
                  </span>
                  <span className="text-[#6D28D9] font-bold">→</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Nagpur
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Soft Bottom Transition Overlay into Next Section */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#f8f7ff] to-transparent pointer-events-none"></div>
      </section>

      {/* HOW TRAVELLIB WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Simple 4-Step Journey"
          title="How TravelLib Works"
          subtitle="Borrow at your departure station, enjoy reading during transit, and drop off at your destination library."
          align="center"
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {howItWorksSteps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <GlassCard hover key={idx} className="flex flex-col justify-between border-purple-200 relative">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-3xl font-black text-purple-700">
                      {item.step}
                    </span>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#24104F] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#4B5563] font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-purple-200 flex items-center justify-between text-[11px] font-black text-[#6D28D9]">
                  <span>Step {idx + 1} of 4</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* FEATURED BOOKS CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <SectionHeading
            badge="Curated Reads"
            title="Popular Travel Books"
            subtitle="Explore top-rated books available across station libraries."
            align="left"
          />
          <Link to="/books">
            <PrimaryButton variant="secondary" className="shrink-0">
              <span>View All Books</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.length > 0 ? (
            featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))
          ) : (
            [
              { id: 1, title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', book_value: 500 },
              { id: 2, title: 'The Psychology of Money', author: 'Morgan Housel', category: 'Finance', book_value: 500 },
              { id: 3, title: '1984', author: 'George Orwell', category: 'Fiction', book_value: 500 },
              { id: 4, title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', category: 'Finance', book_value: 500 }
            ].map((book) => (
              <BookCard key={book.id} book={book} />
            ))
          )}
        </div>
      </section>

      {/* TRAVEL LIBRARY NETWORK MAP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassCard className="p-8 md:p-12 bg-gradient-to-br from-white via-purple-50/90 to-indigo-50/90 border-purple-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-[#6D28D9] border border-purple-200">
                Connected Route Network
              </span>
              <h2 className="text-3xl font-black text-[#24104F]">
                Cross-Return Station Network
              </h2>
              <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed font-medium">
                Our database connects major railway junction libraries. Pick up a book at Mumbai Central and drop off at Nagpur Railway Station cleanly.
              </p>

              <div className="pt-2">
                <Link to="/libraries">
                  <PrimaryButton variant="primary">
                    <MapPin className="w-4 h-4" />
                    <span>Explore All Station Branches</span>
                  </PrimaryButton>
                </Link>
              </div>
            </div>

            {/* Visual Travel Map Diagram */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-panel p-6 rounded-3xl bg-white border-purple-200 shadow-md">
                <div className="flex items-center justify-between text-xs font-black text-[#4B5563] mb-4 uppercase tracking-wider">
                  <span>Origin Station</span>
                  <span className="text-purple-700 flex items-center gap-1">
                    <Train className="w-4 h-4 animate-bounce" /> Active Express Route
                  </span>
                  <span>Target Destination</span>
                </div>

                <div className="flex items-center justify-between gap-4 bg-purple-50/90 p-4 rounded-2xl border border-purple-200">
                  <div className="text-center">
                    <div className="text-base font-black text-[#24104F]">Mumbai Central</div>
                    <div className="text-[11px] font-extrabold text-[#6D28D9]">Station Library A</div>
                  </div>

                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full border-b-2 border-dashed border-purple-400 relative">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 py-1 rounded-full shadow-md text-xs font-black text-[#24104F] border border-purple-300">
                        830 km
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-base font-black text-[#24104F]">Nagpur Railway</div>
                    <div className="text-[11px] font-extrabold text-indigo-700">Station Library B</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* FINAL CTA BANNER (Guaranteed High Contrast Dark Purple Surface) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#2E1065] via-[#3B0764] to-[#4C1D95] text-white p-10 md:p-14 shadow-2xl relative overflow-hidden border border-purple-400/40">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider border border-white/30">
                <Sparkles className="w-4 h-4 text-purple-200" /> Start Reading Today
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                Your next journey deserves a good book.
              </h2>
              <p className="text-purple-100 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                Explore our collection of top books across railway stations and enjoy hassle-free borrowing and returns.
              </p>
              <div className="pt-2">
                <Link to="/books">
                  <PrimaryButton variant="secondary" className="bg-white text-[#24104F] hover:bg-purple-50 font-black">
                    <BookOpen className="w-5 h-5 text-[#6D28D9]" />
                    <span>Browse the Library</span>
                  </PrimaryButton>
                </Link>
              </div>
            </div>

            {/* Mascot Side Accent */}
            <div className="md:col-span-4 flex justify-center items-center">
              <Mascot type="main" size="lg" speech="Let's read together!" float />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
