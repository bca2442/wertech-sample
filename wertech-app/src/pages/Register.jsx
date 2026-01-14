import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleRegister = (e) => {
    e.preventDefault();
    // Save credentials so you can login with them later
    localStorage.setItem('userCredentials', JSON.stringify(formData));
    // Redirect to login page immediately
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] p-12 shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-2xl mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Join Wertech</h1>
          <p className="text-slate-400 font-medium mt-2">Start bartering with your community</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              required
              type="text" 
              placeholder="Full Name" 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-teal-500 dark:text-white transition-all"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              required
              type="email" 
              placeholder="Email Address" 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-teal-500 dark:text-white transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              required
              type="password" 
              placeholder="Create Password" 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 ring-teal-500 dark:text-white transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-teal-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-[0.98] mt-4"
          >
            Create Account <ArrowRight size={20} />
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400 font-bold text-sm">
          Already a member? <Link to="/login" className="text-teal-600 hover:underline">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
}