import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-7xl font-black italic text-teal-400 mb-4 tracking-tighter">
          Wertech
        </h1>
        <p className="text-xl text-slate-400 max-w-md mx-auto mb-12 font-medium">
          A hyper-local digital barter and resource exchange platform.
        </p>

        <button 
          onClick={() => navigate('/login')}
          className="bg-teal-600 hover:bg-teal-500 text-white text-xl font-bold py-5 px-12 rounded-3xl transition-all shadow-lg shadow-teal-600/20 active:scale-95"
        >
          Get Started
        </button>
      </motion.div>
    </div>
  );
}