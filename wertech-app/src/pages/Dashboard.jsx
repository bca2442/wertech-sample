import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, ShieldCheck, Zap, Plus, History, X, Activity, Star, Save 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState([]);
  const [isBarterModalOpen, setIsBarterModalOpen] = useState(false);
  
  // NEW: Rating States
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(4.9);
  const [ratingInput, setRatingInput] = useState(5);

  // Mock data for Active Barters
  const activeBarters = [
    { id: 1, name: "Vintage Camera for Guitar Lessons", status: "In Progress" },
    { id: 2, name: "Web Design for Organic Produce", status: "Pending Approval" },
    { id: 3, name: "Plumbing Service for Used Textbook", status: "In Progress" },
    { id: 4, name: "Piano for Digital Marketing Help", status: "Awaiting Pickup" },
    { id: 5, name: "Bicycle for Gardening Tools", status: "In Progress" },
    { id: 6, name: "Cooking Class for Handyman Work", status: "Pending" },
    { id: 7, name: "DSLR Rental for Graphic Design", status: "In Progress" },
    { id: 8, name: "Yoga Session for Pottery Vase", status: "Completed" }
  ];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('myListings')) || [];
    setMyListings(saved);
    
    // Load saved rating if it exists
    const savedRating = localStorage.getItem('userRating');
    if (savedRating) setCurrentRating(parseFloat(savedRating));
  }, []);

  // Function to handle the new rating
  const handleRecordRating = (e) => {
    e.preventDefault();
    setCurrentRating(ratingInput.toFixed(1));
    localStorage.setItem('userRating', ratingInput.toFixed(1));
    setIsRatingModalOpen(false);
  };

  return (
    <div className="p-10 space-y-10">
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        <button 
          onClick={() => navigate('/create')}
          className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-95"
        >
          <Plus size={20} /> New Listing
        </button>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-teal-600 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <Coins className="mb-6 opacity-80" size={32} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Available Balance</p>
          <h2 className="text-5xl font-black mt-2">1,450 <span className="text-lg opacity-60">WTK</span></h2>
        </div>

        {/* UPDATED: CLICKABLE RATING CARD */}
        <button 
          onClick={() => setIsRatingModalOpen(true)}
          className="text-left bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all group"
        >
          <ShieldCheck className="mb-6 text-teal-600 group-hover:scale-110 transition-transform" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trust Rating</p>
          <h2 className="text-4xl font-black mt-2 dark:text-white">{currentRating}<span className="text-lg text-slate-300">/5.0</span></h2>
        </button>

        <button 
          onClick={() => setIsBarterModalOpen(true)}
          className="text-left bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-sm hover:border-yellow-500/50 transition-all group"
        >
          <Zap className="mb-6 text-yellow-500 group-hover:scale-110 transition-transform" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Barters</p>
          <h2 className="text-4xl font-black mt-2 dark:text-white">08</h2>
        </button>
      </div>

      {/* 3. NEW LISTINGS SECTION */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">My New Listings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {myListings.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-50 dark:border-slate-800 shadow-sm transition-colors">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate">{item.title}</h4>
              <p className="text-teal-600 font-black mt-2">{item.wtk} WTK</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HISTORY SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-50 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <History className="text-teal-600" /> Recent Activity History
          </h3>
          <button onClick={() => navigate('/history')} className="text-teal-600 font-bold text-sm hover:underline">See Full History</button>
        </div>
      </div>

      {/* NEW: RATING MODAL */}
      <AnimatePresence>
        {isRatingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black dark:text-white">Rate Trade</h2>
                <button onClick={() => setIsRatingModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setRatingInput(star)}
                    className={`p-3 rounded-2xl transition-all ${ratingInput >= star ? 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'text-slate-300'}`}
                  >
                    <Star size={32} fill={ratingInput >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>

              <button 
                onClick={handleRecordRating}
                className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg hover:bg-teal-700 transition-all"
              >
                <Save size={20} /> Save Rating
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ACTIVE BARTERS MODAL */}
      <AnimatePresence>
        {isBarterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-2xl">
                    <Activity size={24} />
                  </div>
                  <h2 className="text-2xl font-black dark:text-white">Ongoing Barters</h2>
                </div>
                <button onClick={() => setIsBarterModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {activeBarters.map(barter => (
                  <div key={barter.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent hover:border-yellow-500/20 transition-all group">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white group-hover:text-yellow-500 transition-colors">{barter.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{barter.status}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}