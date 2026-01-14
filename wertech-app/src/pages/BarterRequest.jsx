import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Handshake, CheckCircle, Clock, Check, X } from 'lucide-react';

export default function BarterRequest() {
  const [requests, setRequests] = useState([]);
  const [isSent, setIsSent] = useState(false);
  
  // Simulated current user from your profile
  const currentUser = "Gouri"; 

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wertech_barters') || '[]');
    setRequests(saved);
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newReq = {
      id: Date.now(),
      sender: currentUser,
      receiver: formData.get('receiver'),
      item: formData.get('item'),
      status: 'PENDING',
      time: new Date().toLocaleDateString()
    };
    
    const updated = [newReq, ...requests];
    setRequests(updated);
    localStorage.setItem('wertech_barters', JSON.stringify(updated));
    
    setIsSent(true);
    e.target.reset();
    setTimeout(() => setIsSent(false), 3000);
  };

  const updateStatus = (id, newStatus) => {
    const updated = requests.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    );
    setRequests(updated);
    localStorage.setItem('wertech_barters', JSON.stringify(updated));
  };

  return (
    <div className="p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* SEND REQUEST FORM */}
      <div className="lg:col-span-5 bg-white rounded-[40px] p-10 shadow-sm border border-slate-50 h-fit">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-teal-50 text-teal-600 rounded-3xl">
            <Handshake size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-800">Send Request</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Recipient</label>
            <input name="receiver" required placeholder="To: Username" className="w-full p-5 bg-slate-50 rounded-[24px] border-none outline-none focus:ring-2 ring-teal-500" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Item/Skill Desired</label>
            <input name="item" required placeholder="e.g. Graphic Design" className="w-full p-5 bg-slate-50 rounded-[24px] border-none outline-none focus:ring-2 ring-teal-500" />
          </div>
          <button className="w-full py-5 bg-[#0d9488] text-white rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all">
            Send Barter <Send size={18} />
          </button>
        </form>
      </div>

      {/* REQUEST LEDGER (SEND & RECEIVE) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center gap-3 mb-4 ml-4">
          <Clock size={22} className="text-teal-600" />
          <h3 className="text-xl font-black text-slate-800">Request Ledger</h3>
        </div>
        
        <div className="space-y-4 overflow-y-auto max-h-[700px] pr-2">
          {requests.length === 0 ? (
            <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100 text-slate-300 font-bold">
              No barter activity yet.
            </div>
          ) : (
            requests.map(req => {
              const isIncoming = req.receiver === currentUser;
              return (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={req.id} className="bg-white p-6 rounded-[35px] border border-slate-50 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${isIncoming ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                        {isIncoming ? "IN" : "OUT"}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">
                          {isIncoming ? `From: ${req.sender}` : `To: ${req.receiver}`}
                        </h4>
                        <p className="font-bold text-lg text-slate-800">{req.item}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      req.status === 'ACCEPTED' ? 'bg-teal-600 text-white' : 
                      req.status === 'DECLINED' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  {/* ACTION BUTTONS FOR INCOMING REQUESTS */}
                  {isIncoming && req.status === 'PENDING' && (
                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => updateStatus(req.id, 'ACCEPTED')}
                        className="flex-1 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-700 transition-all"
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button 
                        onClick={() => updateStatus(req.id, 'DECLINED')}
                        className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {isSent && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-10 right-10 bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 z-50">
            <CheckCircle className="text-teal-400" size={20} />
            <span className="font-black uppercase text-[10px] tracking-widest">Request Logged</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}