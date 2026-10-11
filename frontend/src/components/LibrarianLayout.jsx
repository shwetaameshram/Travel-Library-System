import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  ShoppingBag, 
  RotateCcw, 
  Users, 
  GitCommit, 
  BarChart3, 
  Building2, 
  LogOut, 
  Library,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LibrarianLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/librarian/dashboard', icon: LayoutDashboard },
    { name: 'Books', path: '/librarian/books', icon: BookOpen },
    { name: 'Book Stock', path: '/librarian/stock', icon: Layers },
    { name: 'Rentals', path: '/librarian/rentals', icon: ShoppingBag },
    { name: 'Returns', path: '/librarian/returns', icon: RotateCcw },
    { name: 'Passengers', path: '/librarian/passengers', icon: Users },
    { name: 'Connected Libraries', path: '/librarian/connections', icon: GitCommit },
    { name: 'Reports', path: '/librarian/reports', icon: BarChart3 },
    { name: 'Library Profile', path: '/librarian/profile', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 shadow-sm">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Library className="h-5 w-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base leading-tight">Librarian Portal</div>
              <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Station Branch Desk</div>
            </div>
          </div>

          {/* Assigned Library Badge */}
          {user?.library_name && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">{user.library_name}</div>
                <div className="text-[10px] text-slate-600 truncate">{user.library_city}</div>
              </div>
            </div>
          )}
        </div>

        {/* Librarian Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/librarian/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Librarian'}</div>
            <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            <span className="mt-1 inline-block text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Role: Librarian
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-6 md:p-10 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
