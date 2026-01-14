import React, { useState } from 'react';
import { 
  TrendingUp, Users, ArrowUpRight, 
  Activity, Zap, Download, CheckCircle 
} from 'lucide-react';

export default function Analytics() {
  const [showToast, setShowToast] = useState(false);

  // Data values for the Blue Bars
  const graphData = [
    { day: 'MON', height: '65%' },
    { day: 'TUE', height: '45%' },
    { day: 'WED', height: '85%' },
    { day: 'THU', height: '35%' },
    { day: 'FRI', height: '95%' },
    { day: 'SAT', height: '75%' },
    { day: 'SUN', height: '55%' },
  ];

  const handleExport = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Analytics</h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.2em] mt-1 uppercase">Usage Patterns & Growth</p>
        </div>
        <button 
          onClick={handleExport}
          className="px-6 py-4 bg-slate-900 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-blue-600 transition-all"
        >
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ACTIVITY TRENDS - BLUE GRAPH SECTION */}
        <div className="lg:col-span-8 bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <TrendingUp className="text-blue-600" /> Activity Trends
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-4 py-2 rounded-full">
              Real-time
            </span>
          </div>
          
          {/* THE GRAPH FLOOR */}
          <div className="h-80 w-full flex items-end justify-between gap-4 px-4 border-b-2 border-slate-50">
            {graphData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* BLUE BAR */}
                <div 
                  className="w-full bg-blue-600 rounded-t-xl transition-all duration-300 hover:bg-blue-700 cursor-pointer relative"
                  style={{ height: item.height }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.height}
                  </div>
                </div>
                {/* DAY LABEL */}
                <span className="text-[10px] font-black text-slate-400 uppercase mt-4 mb-2">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM PULSE LOG */}
        <div className="lg:col-span-4 bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">System Pulse</h3>
          <div className="space-y-6">
            {[
              { user: 'Rahul K.', action: 'New Barter', color: 'bg-blue-500' },
              { user: 'Gouri', action: 'Accepted Request', color: 'bg-blue-500' },
              { user: 'Admin', action: 'System Update', color: 'bg-slate-800' },
              { user: 'Suresh V.', action: 'Joined', color: 'bg-blue-500' },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${log.color}`} />
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800">{log.user}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-8 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 z-50">
          <CheckCircle className="text-blue-400" size={20} />
          <span className="font-black uppercase text-[10px] tracking-widest">Analytics Exported</span>
        </div>
      )}
    </div>
  );
}