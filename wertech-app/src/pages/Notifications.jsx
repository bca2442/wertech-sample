import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ShieldCheck, Coins, CheckCheck, Trash2, X, MapPin, Calendar, Info } from 'lucide-react';

export default function Notifications() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'request', 
      title: 'New Barter Proposal', 
      message: 'Sana K. wants to exchange "Math Tutoring" for your "Power Drill".', 
      time: '2 MINS AGO', 
      icon: <RefreshCcw />,
      details: "Sana is offering 2 hours of Algebra tutoring in exchange for using your heavy-duty drill for her weekend shelving project.",
      location: "Kadavanthra, Kochi",
      actionLabel: "Accept Exchange"
    },
    { 
      id: 2, 
      type: 'security', 
      title: 'Identity Verified', 
      message: 'Admin has approved your residency status.', 
      time: '5 HOURS AGO', 
      icon: <ShieldCheck />,
      details: "Your government ID verification is complete. You now have a 'Verified Member' badge and can initiate high-value barters.",
      location: "System Office",
      actionLabel: "View Badge"
    },
    { 
      id: 3, 
      type: 'token', 
      title: 'Tokens Received', 
      message: 'You earned +50 WTK for "Community Cleaning Drive".', 
      time: 'YESTERDAY', 
      icon: <Coins />,
      details: "Thank you for participating in the Sunday cleaning drive. These tokens have been added to your Skill Ledger.",
      location: "Panampilly Nagar",
      actionLabel: "View Ledger"
    }
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-6 px-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Notifications</h1>
          <p className="text-slate-500 font-medium">Click any notification to see more details.</p>
        </div>
        <button className="flex items-center gap-2 text-teal-600 font-bold text-sm hover:underline">
          <CheckCheck size={18} /> Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <motion.div 
            key={n.id} 
            onClick={() => setSelectedItem(n)}
            whileHover={{ scale: 1.01 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-start gap-6 cursor-pointer hover:border-teal-200 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">{n.icon}</div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900">{n.title}</h4>
              <p className="text-slate-500 text-sm mt-1">{n.message}</p>
            </div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{n.time}</div>
          </motion.div>
        ))}
      </div>

      {/* DETAILED INFORMATION MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl relative"
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900">
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white">
                  {selectedItem.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedItem.title}</h2>
                  <p className="text-teal-600 font-bold text-sm">{selectedItem.time}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Info size={12}/> Description
                  </label>
                  <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-3xl">
                    {selectedItem.details}
                  </p>
                </div>

                <div className="flex gap-8 px-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Location</label>
                    <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
                      <MapPin size={14} className="text-teal-500" /> {selectedItem.location}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                    <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
                      <Calendar size={14} className="text-teal-500" /> Active
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 bg-teal-600 text-white py-4 rounded-2xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-95"
                  >
                    {selectedItem.actionLabel}
                  </button>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="px-8 bg-slate-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}