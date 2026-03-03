import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Mail, Lock, ArrowRight } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { getApiMessage, toastError, toastSuccess, validateRegistrationForm } from '../utils/feedback';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '' 
  });
  const [usernameState, setUsernameState] = useState({
    checking: false,
    available: true,
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const username = String(formData.username || '').trim();
    if (!username) {
      setUsernameState({ checking: false, available: true, message: '' });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameState((prev) => ({ ...prev, checking: true, message: '' }));
      try {
        const response = await fetch(`/api/auth/username-available?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        if (!response.ok) {
          setUsernameState({ checking: false, available: false, message: data?.message || 'Could not validate username' });
          return;
        }
        if (data.available) {
          setUsernameState({ checking: false, available: true, message: '' });
        } else {
          setUsernameState({ checking: false, available: false, message: 'Username already taken' });
        }
      } catch (err) {
        setUsernameState({ checking: false, available: false, message: 'Could not validate username' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateRegistrationForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (usernameState.checking) {
      setError('Please wait while username availability is being checked.');
      return;
    }
    if (!usernameState.available) {
      setError(usernameState.message || 'Username already taken');
      return;
    }
    
    const newUser = { 
      ...formData, 
      wtk_balance: 0, 
      role: 'user' 
    };

    try {
      setSubmitting(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        toastSuccess('Account created successfully. Please log in.');
        navigate('/login'); 
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = getApiMessage(errorData, 'Registration failed. Please try again.');
        setError(message);
        toastError(message);
      }
    } catch (err) {
      const message = 'Could not connect to server. Please retry.';
      setError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,91,105,0.24),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,122,26,0.2),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(133,154,115,0.2),transparent_40%)]" />

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
          className="hidden lg:flex relative flex-col justify-between p-12 text-white bg-[linear-gradient(120deg,#f45b69_0%,#ff7a1a_52%,#859a73_100%)] bg-[length:180%_180%] animate-[shimmer-flow_4.8s_ease_infinite]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_40%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 text-xs font-black uppercase tracking-[0.2em]">
              <BrandLogo size={18} withText={false} />
              Wertech
            </div>
            <h2 className="mt-8 text-4xl leading-tight font-black">Create Your Trade Identity.</h2>
            <p className="mt-4 text-sm font-semibold text-white/85 max-w-sm">
              Join the exchange network and start listing services, items, and opportunities.
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
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-500 via-orange-500 to-lime-700 text-white rounded-2xl mb-5 shadow-lg shadow-rose-500/30">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Set up your profile and start trading.</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 font-bold text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="text" 
                placeholder="Username" 
                className="w-full pl-14 pr-6 py-4 app-input"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            {formData.username.trim() && (
              <p className={`text-xs font-bold ml-1 ${
                usernameState.checking
                  ? 'text-slate-400'
                  : usernameState.available
                    ? 'text-emerald-600'
                    : 'text-rose-600'
              }`}>
                {usernameState.checking
                  ? 'Checking username...'
                  : usernameState.available
                    ? 'Username is available'
                    : usernameState.message}
              </p>
            )}
            
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="email" 
                placeholder="Email Address" 
                className="w-full pl-14 pr-6 py-4 app-input"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="password" 
                placeholder="Create Password" 
                className="w-full pl-14 pr-6 py-4 app-input"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting || usernameState.checking || !usernameState.available}
              className="w-full app-btn-primary py-4 text-lg flex items-center justify-center gap-3 mt-2"
            >
              {submitting ? 'Creating Account...' : 'Create Account'} <ArrowRight size={20} />
            </button>
          </form>

          <p className="text-center lg:text-left mt-8 text-slate-500 dark:text-slate-400 font-bold text-sm">
            Already a member? <Link to="/login" className="text-fuchsia-600 hover:underline">Log In</Link>
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}

