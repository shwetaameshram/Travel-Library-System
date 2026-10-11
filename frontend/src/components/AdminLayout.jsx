import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCheck,
  Users,
  BookOpen, 
  Building2, 
  Layers, 
  GitCommit, 
  ShoppingBag, 
  RotateCcw, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Librarians', path: '/admin/librarians', icon: UserCheck },
    { name: 'Users / Passengers', path: '/admin/users', icon: Users },
    { name: 'Libraries', path: '/admin/libraries', icon: Building2 },
    { name: 'Books', path: '/admin/books', icon: BookOpen },
    { name: 'Library Stock', path: '/admin/stock', icon: Layers },
    { name: 'Connections', path: '/admin/connections', icon: GitCommit },
    { name: 'Rentals', path: '/admin/rentals', icon: ShoppingBag },
    { name: 'Returns', path: '/admin/returns', icon: RotateCcw },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 shadow-sm">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-base leading-tight">Admin Portal</div>
            <div className="text-xs text-rose-600 font-semibold">Travel Library Management</div>
          </div>
        </div>

        {/* Admin Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            <span className="mt-1 inline-block text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              Role: Admin
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout Admin
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 overflow-x-hidden p-6 md:p-10 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
