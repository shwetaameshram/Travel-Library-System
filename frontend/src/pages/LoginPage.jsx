import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(formData.email, formData.password);
      if (res.success) {
        const userRole = res.user?.role;
        if (userRole === 'librarian') {
          navigate('/librarian/dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.message || 'Login failed. Invalid credentials.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <GlassCard className="p-8 border-white/80 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Mascot type="main" size="md" float speech="Welcome Back!" />
          <h1 className="text-2xl font-black text-slate-900">Sign In to TravelLib</h1>
          <p className="text-slate-600 text-xs font-medium">Access your active rentals, bookings, and digital receipts</p>
        </div>

        {error && (
          <GlassCard className="p-4 bg-rose-50/90 border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
            <span className="font-bold">{error}</span>
          </GlassCard>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="passenger@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
          </div>

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </form>

        <div className="pt-2 text-center text-xs text-slate-600 font-medium">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-purple-700 font-extrabold hover:underline">
            Create Free Account
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
