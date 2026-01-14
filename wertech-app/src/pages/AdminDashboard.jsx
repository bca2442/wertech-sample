import React, { useState } from 'react';
import { 
  Users, Flag, Settings, Trash2, 
  UserCheck, Save, AlertTriangle, Clock 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  
  // State for Maintenance Mode Toggle
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Mock User Data
  const [users] = useState([
    { id: 1, name: 'Gouri', email: 'gouri@wertech.com', status: 'Verified' },
    { id: 2, name: 'Rahul K.', email: 'rahul@wertech.com', status: 'Verified' },
    { id: 3, name: 'Unknown User', email: 'spam@bot.net', status: 'Flagged' },
  ]);

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Admin Control</h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.2em] mt-1 uppercase">System Oversight & Management</p>
        </div>
        
        {/* TAB NAVIGATION */}
        <div className="flex bg-white p-2 rounded-[24px] shadow-sm border border-slate-100">
          {['users', 'reports', 'settings'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="bg-white rounded-[40px] p-10 border border-slate-50 shadow-sm min-h-[600px]">
        
        {/* USERS MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Users className="text-[#0d9488]" /> User Directory
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="pb-4 px-4">Member Info</th>
                    <th className="pb-4 px-4">Account Status</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user) => (
                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6 px-4">
                        <p className="font-black text-slate-800">{user.name}</p>
                        <p className="text-xs font-bold text-slate-400">{user.email}</p>
                      </td>
                      <td className="py-6 px-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          user.status === 'Flagged' 
                            ? 'bg-red-50 text-red-500' 
                            : 'bg-teal-50 text-teal-600'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-right space-x-2">
                        <button className="p-2 text-slate-300 hover:text-teal-600 transition-all"><UserCheck size={20}/></button>
                        <button className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="p-8 bg-amber-50 text-amber-500 rounded-[30px] mb-6">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">System is Clean</h3>
            <p className="text-slate-400 font-bold text-sm mt-2 italic">There are no pending user reports or disputes.</p>
          </div>
        )}

        {/* SETTINGS TAB WITH WORKING TOGGLE */}
        {activeTab === 'settings' && (
          <div className="max-w-xl space-y-10">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Settings className="text-[#0d9488]" /> System Configuration
              </h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest ml-1">Global Application Controls</p>
            </div>

            <div className="space-y-6">
              {/* MAINTENANCE MODE TOGGLE */}
              <div className="flex justify-between items-center p-8 bg-slate-50 rounded-[35px] border border-slate-100/50">
                <div>
                  <p className="font-black text-slate-800">Maintenance Mode</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight mt-1">
                    Disable all trade transactions
                  </p>
                </div>

                {/* THE TOGGLE SWITCH */}
                <button 
                  onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                  className={`w-16 h-8 flex items-center rounded-full p-1 transition-all duration-300 ${
                    isMaintenanceMode ? 'bg-[#0d9488]' : 'bg-slate-300'
                  }`}
                >
                  <div 
                    className={`bg-white w-6 h-6 rounded-full shadow-lg transform transition-transform duration-300 ${
                      isMaintenanceMode ? 'translate-x-8' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* OTHER SETTING EXAMPLE */}
              <div className="flex justify-between items-center p-8 bg-slate-50 rounded-[35px] border border-slate-100/50">
                <div>
                  <p className="font-black text-slate-800">Public Exploration</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight mt-1">
                    Allow non-users to browse listings
                  </p>
                </div>
                <div className="w-16 h-8 bg-[#0d9488] flex items-center rounded-full p-1 opacity-50 cursor-not-allowed">
                   <div className="bg-white w-6 h-6 rounded-full translate-x-8" />
                </div>
              </div>

              <button className="w-full py-6 bg-[#0d9488] text-white rounded-[28px] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                <Save size={20} /> Save System Changes
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}