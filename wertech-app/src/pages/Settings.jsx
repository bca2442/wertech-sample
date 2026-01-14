import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Lock, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';

export default function Settings() {
  // Sync state with localStorage so the theme stays the same on refresh
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [pushNotifs, setPushNotifs] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  // This useEffect injects the 'dark' class into the root document
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const Toggle = ({ enabled, setEnabled }) => (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`w-14 h-7 rounded-full transition-all duration-500 relative ${
        enabled ? 'bg-teal-600 shadow-lg shadow-teal-600/20' : 'bg-slate-200'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 28 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
      />
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 max-w-4xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-[24px]">
          <Lock size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white transition-colors">Account Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your community preferences.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-50 dark:border-slate-800 shadow-sm transition-all duration-500">
        
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-[32px] border border-transparent hover:border-teal-500/30 transition-all">
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              {darkMode ? <Sun size={28} /> : <Moon size={28} />}
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Dark Mode</h4>
              <p className="text-sm text-slate-400 font-medium">Toggle the theme for the entire app.</p>
            </div>
          </div>
          <Toggle enabled={darkMode} setEnabled={setDarkMode} />
        </div>

        {/* Public Profile Toggle */}
        <div className="flex items-center justify-between p-6 rounded-[32px] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all mt-4">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
              <Shield size={28} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Public Profile</h4>
              <p className="text-sm text-slate-400 font-medium">Let others see your skills.</p>
            </div>
          </div>
          <Toggle enabled={publicProfile} setEnabled={setPublicProfile} />
        </div>

        <button className="w-full mt-10 p-6 rounded-[32px] bg-red-50 dark:bg-red-900/10 text-red-600 font-black flex items-center justify-center gap-3 hover:bg-red-100 transition-all">
          <LogOut size={22} /> Log Out from All Devices
        </button>
      </div>
    </motion.div>
  );
}