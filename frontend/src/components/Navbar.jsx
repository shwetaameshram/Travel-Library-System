import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, User, LogOut, Menu, X, BookMarked, MapPin, Home, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Mascot from './ui/Mascot';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="glass-nav sticky top-0 z-50 w-full transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo with Mascot Accent */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-all duration-300">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-600"></span>
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-heading">
                Travel<span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Lib</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                Library System
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Read on your journey • Return anywhere
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-full glass-pill shadow-xs">
          <Link
            to="/"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
              isActive('/')
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Home className="h-4 w-4" /> Home
          </Link>

          <Link
            to="/books"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
              isActive('/books')
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Books
          </Link>

          <Link
            to="/libraries"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
              isActive('/libraries')
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <MapPin className="h-4 w-4" /> Libraries
          </Link>

          {isAuthenticated && user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                isActive('/admin')
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Sparkles className="h-4 w-4" /> Admin Portal
            </Link>
          )}

          {isAuthenticated && user?.role === 'librarian' && (
            <Link
              to="/librarian/dashboard"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                isActive('/librarian/dashboard')
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Sparkles className="h-4 w-4" /> Librarian
            </Link>
          )}

          {isAuthenticated && user?.role === 'user' && (
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BookMarked className="h-4 w-4" /> My Rentals
            </Link>
          )}
        </nav>

        {/* Desktop User Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to={user?.role === 'admin' ? '/admin' : user?.role === 'librarian' ? '/librarian/dashboard' : '/dashboard'}
                className="flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-panel hover:bg-white border-purple-200/80 text-slate-800 text-xs font-bold shadow-sm transition-all hover:scale-105"
              >
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2.5 rounded-2xl glass-panel hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-purple-200/80 hover:border-rose-200 transition-all cursor-pointer shadow-sm"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-purple-700 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2.5 rounded-2xl glass-panel text-slate-700 hover:text-slate-900"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-purple-100 px-4 pt-3 pb-5 space-y-2.5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-slate-700 hover:bg-purple-50 font-bold text-sm"
          >
            Home
          </Link>
          <Link
            to="/books"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-slate-700 hover:bg-purple-50 font-bold text-sm"
          >
            Books
          </Link>
          <Link
            to="/libraries"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-slate-700 hover:bg-purple-50 font-bold text-sm"
          >
            Libraries
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={user?.role === 'admin' ? '/admin' : user?.role === 'librarian' ? '/librarian/dashboard' : '/dashboard'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-purple-900 bg-purple-100/80 font-bold text-sm"
              >
                {user?.role === 'admin' ? 'Admin Portal' : user?.role === 'librarian' ? 'Librarian Portal' : 'My Rentals'} ({user.name})
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-white text-slate-800 font-bold border border-purple-200 shadow-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/20"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
