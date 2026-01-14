import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, ShieldCheck, Coins, Edit3, Trash2, 
  Package, ExternalLink, X, Save, Plus, Navigation, Locate 
} from 'lucide-react';

export default function Profile() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  
  // Profile State with Radius and Localization
  const [profile, setProfile] = useState({
    name: "Arjun Das",
    location: "Kadavanthra, Kochi",
    tokens: 1450,
    skills: ["Web Design", "Gardening", "Plumbing"],
    radius: 15 // Default 15km radius
  });

  const [editForm, setEditForm] = useState({ ...profile });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('myListings')) || [];
    setMyListings(saved);
    const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
    if (savedProfile) setProfile(savedProfile);
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile({ ...editForm });
    setIsEditModalOpen(false);
    localStorage.setItem('userProfile', JSON.stringify(editForm));
  };

  const addSkill = () => {
    if (newSkillInput.trim() && !editForm.skills.includes(newSkillInput.trim())) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, newSkillInput.trim()]
      });
      setNewSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(s => s !== skillToRemove)
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 max-w-5xl mx-auto space-y-8">
      {/* HEADER CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col md:flex-row items-center gap-10 transition-colors">
        <div className="w-32 h-32 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 text-4xl font-black border-4 border-white dark:border-slate-800 shadow-xl relative">
          {profile.name[0]}
          <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-xl shadow-lg">
            <Coins size={20} />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white">{profile.name}</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2">
            <p className="text-slate-400 font-bold flex items-center justify-center md:justify-start gap-2">
              <MapPin size={18} className="text-teal-600"/> {profile.location}
            </p>
            {/* RADIUS BADGE */}
            <p className="text-teal-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              <Navigation size={14} /> {profile.radius}km Discovery
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={14} /> Verified Member
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-slate-900 dark:bg-teal-600 text-white px-8 py-4 rounded-[24px] text-center shadow-lg transition-colors">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Balance</p>
            <p className="text-2xl font-black">{profile.tokens} WTK</p>
          </div>
          <button 
            onClick={() => { setEditForm({...profile}); setIsEditModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <Edit3 size={18}/> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-50 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Skill Tags</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map(skill => (
              <span key={skill} className="px-4 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl font-bold text-xs border border-teal-100 dark:border-teal-800">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-50 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-8">
              <Package className="text-teal-600" /> My Public Listings
            </h3>
            <div className="space-y-4">
              {myListings.length > 0 ? myListings.map(item => (
                <div key={item.id} className="group flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm"><ExternalLink size={20} /></div>
                    <div><p className="font-bold text-slate-900 dark:text-white">{item.title}</p></div>
                  </div>
                  <span className="text-teal-600 font-black">{item.wtk} WTK</span>
                </div>
              )) : (
                <p className="text-slate-400 font-bold text-center py-4 italic">No active listings.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL WITH KM RADIUS */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black dark:text-white">Profile Settings</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full mt-2 p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none ring-2 ring-transparent focus:ring-teal-500 font-bold transition-all" />
                </div>
                
                {/* LOCALIZATION FEATURE */}
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Location</label>
                  <div className="relative">
                    <input type="text" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full mt-2 p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none ring-2 ring-transparent focus:ring-teal-500 font-bold transition-all" />
                    <Locate className="absolute right-5 top-7 text-teal-600 cursor-pointer" size={20} />
                  </div>
                </div>

                {/* ADJUSTABLE RADIUS SLIDER */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Discovery Radius</label>
                    <span className="text-teal-600 font-black">{editForm.radius} km</span>
                  </div>
                  <input 
                    type="range" min="1" max="100" 
                    value={editForm.radius} 
                    onChange={(e) => setEditForm({...editForm, radius: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <p className="text-[10px] text-slate-400 font-bold mt-3">Barters will be visible to users within this distance.</p>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Skills</label>
                  <div className="flex gap-2 mt-2 mb-4">
                    <input type="text" value={newSkillInput} onChange={(e) => setNewSkillInput(e.target.value)} placeholder="New Skill Name"
                      className="flex-1 p-5 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none ring-2 ring-transparent focus:ring-teal-500 font-bold transition-all" />
                    <button type="button" onClick={addSkill} className="p-5 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 transition-all"><Plus size={24} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editForm.skills.map(skill => (
                      <div key={skill} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)}><X size={14} className="hover:text-red-500"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg hover:bg-teal-700 transition-all">
                  <Save size={20} /> Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}