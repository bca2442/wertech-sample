import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Download, 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';

export default function SkillLedger() {
  const navigate = useNavigate();

  // Function to simulate downloading a statement
  const handleDownloadStatement = () => {
    alert("Generating your transaction statement for October 2025... Your download will begin shortly.");
    // In a production app, this would trigger a PDF generation or API call
  };

  // Function to handle redeeming skills
  const handleRedeemSkills = () => {
    // Navigates the user to the Explore page to spend their credits
    navigate('/explore');
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Balance Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-4">Total Skill Credits</p>
          <div className="flex items-baseline gap-4">
            <h2 className="text-7xl font-black">1,450</h2>
            <span className="text-2xl font-medium opacity-40">WTK</span>
          </div>

          <div className="flex gap-4 mt-10">
            {/* Functional Redeem Button */}
            <button 
              onClick={handleRedeemSkills}
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-teal-50 transition-all active:scale-95"
            >
              <Zap size={18} className="fill-teal-500 text-teal-500" /> Redeem for Skills
            </button>

            {/* Functional Statement Button */}
            <button 
              onClick={handleDownloadStatement}
              className="border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95"
            >
              <Download size={18} /> Statement
            </button>
          </div>
        </div>

        {/* Growth Stats */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <ArrowUpRight size={14} className="text-teal-500" /> Monthly Growth
            </p>
            <h3 className="text-4xl font-black text-slate-900">+450 WTK</h3>
            <p className="text-sm text-slate-400 mt-2">Earned this month</p>
          </div>
          
          <div className="pt-6 border-t border-slate-50">
            <div className="flex justify-between mb-2">
               <span className="text-xs font-bold text-slate-500">Community Trust</span>
               <span className="text-xs font-black text-teal-600">High</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
               <div className="bg-teal-500 h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
         {/* ... (rest of your table code) ... */}
      </div>
    </div>
  );
}