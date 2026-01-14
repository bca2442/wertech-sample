import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, MapPin, X, Zap, 
  FilterX, User, Navigation, Coins 
} from 'lucide-react';

export default function Explore() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [maxDistance, setMaxDistance] = useState(5);
  const [maxPrice, setMaxPrice] = useState(300);

  const listings = [
    { id: 1, title: 'Power Drill', category: 'Tools', wtk: 40, dist: 0.8, user: 'Rahul K.', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500', desc: 'Heavy duty brushless motor drill. Includes 2 batteries.' },
    { id: 2, title: 'Yoga Session', category: 'Wellness', wtk: 60, dist: 1.2, user: 'Priya S.', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500', desc: '1-hour Vinyasa flow focusing on breath and flexibility.' },
    { id: 3, title: 'Python Tutoring', category: 'Education', wtk: 150, dist: 2.5, user: 'Sara M.', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500', desc: 'Beginner friendly coding help for data science.' },
    { id: 4, title: 'Hammer Drill', category: 'Tools', wtk: 35, dist: 1.5, user: 'Amit V.', image: 'https://images.unsplash.com/photo-1581147036324-c17da42e16c2?w=500', desc: 'Impact drill for masonry and concrete.' },
    { id: 5, title: 'Meditation Guide', category: 'Wellness', wtk: 30, dist: 0.5, user: 'Anjali R.', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500', desc: 'Guided mindfulness and deep breathing sessions.' },
    { id: 6, title: 'Gardening Kit', category: 'Tools', wtk: 25, dist: 3.1, user: 'Arjun D.', image: 'https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=500', desc: 'Complete set of trowels and shears for home gardening.' },
    { id: 7, title: 'UI Design Course', category: 'Education', wtk: 210, dist: 0.2, user: 'Sana K.', image: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=500', desc: 'Master Figma and modern UI/UX principles.' }
  ];

  const filteredListings = listings.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesTab = activeTab === 'All' || item.category === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(query) || item.user.toLowerCase().includes(query);
    const matchesDist = item.dist <= maxDistance;
    const matchesPrice = item.wtk <= maxPrice;
    return matchesTab && matchesSearch && matchesDist && matchesPrice;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-600" size={20} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products or users..." 
            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 outline-none ring-2 ring-transparent focus:ring-teal-500 transition-all font-bold shadow-sm dark:text-white" 
          />
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          className={`p-5 rounded-[24px] transition-all flex items-center gap-3 shadow-lg ${showFilters ? 'bg-teal-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
        >
          <SlidersHorizontal size={24}/>
          <span className="font-bold text-sm">Filter Options</span>
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 z-[70] p-10 shadow-2xl space-y-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black dark:text-white">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 dark:text-white"><X /></button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                  <label className="flex items-center gap-2"><Navigation size={12}/> Max Distance</label>
                  <span>{maxDistance} km</span>
                </div>
                <input type="range" min="0.5" max="10" step="0.5" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} className="w-full accent-teal-600" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                  <label className="flex items-center gap-2"><Coins size={12}/> Max WTK</label>
                  <span>{maxPrice} WTK</span>
                </div>
                <input type="range" min="10" max="500" step="10" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full accent-teal-600" />
              </div>
              <button onClick={() => {setMaxDistance(10); setMaxPrice(500); setSearchQuery("");}} className="w-full py-4 text-slate-400 font-bold text-xs uppercase hover:text-red-500">Reset Filters</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode='popLayout'>
          {filteredListings.map(item => (
            <motion.div layout key={item.id} className="bg-white dark:bg-slate-900 rounded-[40px] border dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all">
              <div className="h-52 overflow-hidden relative">
                <img src={item.image} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 px-4 py-1.5 rounded-full text-[9px] font-black text-teal-600 uppercase">{item.category}</span>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black dark:text-white leading-tight">{item.title}</h3>
                  <p className="text-2xl font-black text-teal-600">{item.wtk}</p>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase border-t dark:border-slate-800 pt-5">
                  <span className="flex items-center gap-1"><MapPin size={12} className="text-teal-600"/> {item.dist} km</span>
                  <span className="flex items-center gap-1"><User size={12}/> {item.user}</span>
                </div>
                <button onClick={() => setSelectedItem(item)} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-teal-600 transition-all">View Details</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] overflow-hidden relative shadow-2xl border dark:border-slate-800">
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 z-10 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all"><X size={20} /></button>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <img src={selectedItem.image} className="h-64 md:h-full object-cover" alt="" />
                <div className="p-10 space-y-6">
                  <div>
                    <span className="text-teal-600 font-black text-[10px] uppercase tracking-widest">{selectedItem.category}</span>
                    <h2 className="text-3xl font-black dark:text-white mt-1">{selectedItem.title}</h2>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{selectedItem.desc}</p>
                  <div className="pt-6 border-t dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-black text-teal-600">{selectedItem.wtk} WTK</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Owner: {selectedItem.user}</p>
                    </div>
                    <button 
                      onClick={() => navigate('/barter-request', { state: { item: selectedItem } })}
                      className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-teal-700 transition-all"
                    >
                      Propose Trade <Zap size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}