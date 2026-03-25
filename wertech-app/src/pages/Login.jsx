import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Palette } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { setAuthSession } from '../utils/authClient';
import { getApiMessage, toastError, toastSuccess, validateLoginForm } from '../utils/feedback';

export default function Login() {
  const navigate = useNavigate();
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validateLoginForm({ emailOrUser, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUser, password: password })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setAuthSession(data);
        toastSuccess('Signed in successfully.');

        if (data.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        const message = getApiMessage(data, 'Invalid credentials.');
        setError(message);
        toastError(message);
      }
    } catch (err) {
      const message = 'Connection failed. Please try again.';
      setError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,183,255,0.24),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(37,99,255,0.2),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(60,242,255,0.18),transparent_40%)]" />
      <motion.div
        aria-hidden
        initial={{ y: -30, opacity: 0.4 }}
        animate={{ y: 20, opacity: 0.8 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 6, ease: 'easeInOut' }}
        className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl"
      />
      <motion.div
        aria-hidden
        initial={{ y: 30, opacity: 0.35 }}
        animate={{ y: -20, opacity: 0.75 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 7, ease: 'easeInOut' }}
        className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl"
      />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 grid grid-cols-1 lg:grid-cols-2 max-w-5xl w-full rounded-[36px] overflow-hidden border border-white/40 dark:border-slate-800 shadow-[0_24px_80px_rgba(15,23,42,0.22)] bg-white/70 dark:bg-slate-900/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="hidden lg:flex relative flex-col justify-between p-12 text-white bg-[linear-gradient(120deg,#2563ff_0%,#00b7ff_52%,#3cf2ff_100%)] bg-[length:180%_180%] animate-[shimmer-flow_4.8s_ease_infinite]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_40%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-[0.2em]">
              <BrandLogo size={18} withText={false} />
              Wertech
            </div>
            <h2 className="mt-8 text-4xl leading-tight font-black">Trade Smarter. Move Faster.</h2>
            <p className="mt-4 text-sm font-semibold text-white/85 max-w-sm">
              Access your barter wallet, active deals, and community exchanges in one premium dashboard.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          className="p-8 sm:p-10 lg:p-12"
        >
          <div className="text-center lg:text-left mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 via-cyan-500 to-cyan-300 text-white rounded-2xl mb-5 shadow-lg shadow-cyan-500/30">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Sign in and continue your trade flow.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center gap-3 text-sm font-bold border border-rose-100 dark:border-rose-900/30"
            >
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="text" 
                placeholder="Email or Username" 
                className="w-full pl-14 pr-6 py-4 bg-white/85 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-teal-500 dark:text-white transition-all font-semibold border border-slate-200 dark:border-slate-700"
                onChange={(e) => setEmailOrUser(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="password" 
                placeholder="Password" 
                className="w-full pl-14 pr-6 py-4 bg-white/85 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-teal-500 dark:text-white transition-all font-semibold border border-slate-200 dark:border-slate-700"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-cyan-600/20 hover:from-teal-700 hover:to-cyan-700 transition-all active:scale-[0.985] mt-2"
            >
              {submitting ? 'Signing In...' : 'Sign In'} <ArrowRight size={20} />
            </button>
          </form>

          <div className="flex items-center justify-center lg:justify-start gap-2 mt-6 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.15em]">
            <Palette size={14} className="text-teal-500" />
            High-trust access
          </div>

          <p className="text-center lg:text-left mt-8 text-slate-500 dark:text-slate-400 font-bold text-sm">
            New here? <Link to="/register" className="text-cyan-600 hover:underline">Create an account</Link>
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}

