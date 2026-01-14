import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // 1. Retrieve the credentials saved during registration
    const savedUser = JSON.parse(localStorage.getItem('userCredentials'));

    // 2. Validation Logic
    if (savedUser && savedUser.email === email && savedUser.password === password) {
      // SUCCESS: Redirect to dashboard instantly without notification
      navigate('/dashboard');
    } else {
      // FAILURE: Show error message directly on the page
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] p-12 shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-2xl mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="text-slate-400 font-medium mt-2">Login to manage your barters</p>
        </div>

        {/* Error Message Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 dark:border-red-900/30"
          >
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              required
              type="email" 
              placeholder="Email Address" 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-teal-500 dark:text-white transition-all font-medium"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              required
              type="password" 
              placeholder="Password" 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-teal-500 dark:text-white transition-all font-medium"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-teal-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-[0.98] mt-4"
          >
            Login <ArrowRight size={20} />
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 font-bold text-sm">
          New to Wertech? <Link to="/register" className="text-teal-600 hover:underline">Create an Account</Link>
        </p>
      </motion.div>
    </div>
  );
}