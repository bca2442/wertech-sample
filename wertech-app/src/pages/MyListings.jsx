import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Package, Trash2, ExternalLink, 
  Tag, MapPin, Clock, AlertCircle 
} from 'lucide-react';

export default function MyListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);

  // Load listings from localStorage on mount
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('myListings')) || [];
    setListings(savedData);
  }, []);

  const handleDelete = (id) => {
    const updated = listings.filter(item => item.id !== id);
    setListings(updated);
    localStorage.setItem('myListings', JSON.stringify(updated));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="p-10 max-w-6xl mx-auto space-y-10"
    >
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">My Inventory</h1>
          <p className="text-slate-400 font-bold mt-1 text-sm uppercase tracking-widest">Manage your public barters</p>
        </div>
        <button 
          onClick={() => navigate('/create-listing')}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-[24px] font-black flex items-center gap-3 shadow-lg shadow-teal-600/20 transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Add New Listing
        </button>
      </div>

      {/* LISTINGS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {listings.length > 0 ? (
            listings.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm group relative overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  {item.type === 'item' ? <Package size={80} /> : <Tag size={80} />}
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      item.type === 'item' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                    }`}>
                      {item.type === 'item' ? 'Physical Item' : 'Professional Skill'}
                    </div>
                    <span className="text-teal-600 font-black text-xl">{item.wtk} WTK</span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                    {item.title}
                  </h3>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <MapPin size={14} className="text-teal-600" /> {item.location}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <Clock size={14} /> Listed on {item.date}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                    <button className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                      <ExternalLink size={14} /> View Details
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-4 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your Inventory is Empty</h2>
              <p className="text-slate-400 font-bold mt-2 mb-8">Ready to start bartering? Add your first item.</p>
              <button 
                onClick={() => navigate('/create-listing')}
                className="text-teal-600 font-black uppercase tracking-widest hover:underline"
              >
                Create Listing Now
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}