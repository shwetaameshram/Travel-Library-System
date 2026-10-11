import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';
import Mascot from '../components/ui/Mascot';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Form validations
    if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password
      });

      if (res.success) {
        setSuccess('Registration successful! Redirecting to login page...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Server error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <GlassCard className="p-8 border-white/80 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Mascot type="main" size="md" float speech="Join the Journey!" />
          <h1 className="text-2xl font-black text-slate-900">Create Passenger Account</h1>
          <p className="text-slate-600 text-xs font-medium">Register to rent books across railway stations & airport hubs</p>
        </div>

        {error && (
          <GlassCard className="p-4 bg-rose-50/90 border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
            <span className="font-bold">{error}</span>
          </GlassCard>
        )}

        {success && (
          <GlassCard className="p-4 bg-emerald-50/90 border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <span className="font-bold">{success}</span>
          </GlassCard>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-purple-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+91 9876543210"
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

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-purple-500" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
            {loading ? 'Creating Account...' : 'Register Account'}
            <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </form>

        <div className="pt-2 text-center text-xs text-slate-600 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-700 font-extrabold hover:underline">
            Sign In Here
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
