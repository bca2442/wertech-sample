import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Package, Zap, ArrowLeft, PartyPopper, MapPin, Coins } from 'lucide-react';

export default function CreateListing() {
  const navigate = useNavigate();
  const [type, setType] = useState('item');
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePublish = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const newListing = {
      id: Date.now(),
      title: formData.get('title'),
      wtk: formData.get('wtk'),
      location: formData.get('location'),
      type: type,
      date: new Date().toLocaleDateString()
    };

    // Save to localStorage so MyListings.jsx can read it
    const existing = JSON.parse(localStorage.getItem('myListings')) || [];
    localStorage.setItem('myListings', JSON.stringify([newListing, ...existing]));

    // Trigger Success Animation
    setShowSuccess(true);

    // Redirect to My Inventory instead of Dashboard
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/my-listings'); 
    }, 2500);
  };

  return (
    <div className="p-10 max-w-3xl mx-auto space-y-8">
      {/* BACK BUTTON */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-400 font-bold hover:text-teal-600 transition-all group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
        <span>Back to Inventory</span>
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-sm border border-slate-50 dark:border-slate-800 space-y-10 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create New Barter</h1>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Offer items or services to the community</p>
        </div>

        {/* TYPE TOGGLE */}
        <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl gap-2">
          <button 
            type="button"
            onClick={() => setType('item')} 
            className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${type === 'item' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400'}`}
          >
            Physical Item
          </button>
          <button 
            type="button"
            onClick={() => setType('skill')} 
            className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${type === 'skill' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400'}`}
          >
            Professional Skill
          </button>
        </div>

        {/* FORM SECTION */}
        <form onSubmit={handlePublish} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Listing Title</label>
            <input 
              name="title" 
              required 
              placeholder="e.g. Vintage Acoustic Guitar" 
              className="w-full p-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[24px] outline-none ring-2 ring-transparent focus:ring-teal-500 font-bold transition-all" 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">WTK Value</label>
              <div className="relative">
                <input 
                  name="wtk" 
                  required 
                  type="number" 
                  placeholder="500" 
                  className="w-full p-6 pl-14 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[24px] outline-none ring-2 ring-transparent focus:ring-teal-500 font-bold transition-all" 
                />
                <Coins className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-600" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Your Location</label>
              <div className="relative">
                <input 
                  name="location" 
                  required 
                  placeholder="Kochi, Kerala" 
                  className="w-full p-6 pl-14 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[24px] outline-none ring-2 ring-transparent focus:ring-teal-500 font-bold transition-all" 
                />
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-600" size={20} />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-teal-600 text-white py-6 rounded-[28px] font-black text-lg hover:bg-teal-700 shadow-xl shadow-teal-600/20 active:scale-[0.98] transition-all"
          >
            Publish Listing
          </button>
        </form>
      </div>

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-900 p-12 rounded-[50px] text-center max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="w-24 h-24 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <PartyPopper size={48} className="text-teal-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Success!</h2>
              <p className="text-slate-400 font-bold mt-2">Redirecting to your inventory...</p>
              
              <div className="mt-8 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 2.2, ease: "easeInOut" }} 
                  className="h-full bg-teal-600" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}