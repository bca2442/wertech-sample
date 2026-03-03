import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, SlidersHorizontal, MapPin, X, Zap,
  User, Navigation, Coins, Mail, Share2, ArrowUpRight
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const TABS = ['All', 'Users', 'Products', 'Skills', 'Area'];
const HISTORY_KEY = 'wertech_explore_search_history_v1';
const SEARCH_SUGGESTIONS = ['Search users...', 'Search products...', 'Search skills...', 'Search area...'];
const LEGEND_QUOTES = [
  { text: 'The best way to find yourself is to lose yourself in the service of others.', author: 'Mahatma Gandhi' },
  { text: 'Alone we can do so little; together we can do so much.', author: 'Helen Keller' },
  { text: 'Quality means doing it right when no one is looking.', author: 'Henry Ford' },
  { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { text: 'Coming together is a beginning; keeping together is progress.', author: 'Henry Ford' }
];

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUsername = localStorage.getItem('username') || '';
  const [selectedItem, setSelectedItem] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState(100);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, listingsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/listings')
        ]);
        const [usersData, listingsData] = await Promise.all([usersRes.json(), listingsRes.json()]);

        if (usersRes.ok && Array.isArray(usersData)) {
          const mappedUsers = usersData.map((u) => ({
            id: u._id || u.username,
            username: u.username,
            email: u.email,
            location: u.location || 'Unknown',
            status: u.status || 'Verified',
            profileImage: u.profile_image || '',
            radius: Number(u.radius || 0),
            skills: Array.isArray(u.skills) ? u.skills : []
          }));
          setUsers(mappedUsers);
          if (listingsRes.ok && Array.isArray(listingsData)) {
            const byUsername = new Map(mappedUsers.map((u) => [u.username, u]));
            const mappedListings = listingsData.map((item) => {
              const ownerProfile = byUsername.get(item.owner_username);
              return {
                id: item._id,
                title: item.title,
                category: item.type === 'skill' ? 'Skill' : 'Product',
                wtk: Number(item.wtk || 0),
                dist: Number(ownerProfile?.radius || 0),
                user: item.owner_username,
                image: item.image || '',
                desc: item.description || '',
                location: item.location || '',
                date: item.date || ''
              };
            });
            setListings(mappedListings);
          }
        } else if (listingsRes.ok && Array.isArray(listingsData)) {
          const mappedListings = listingsData.map((item) => ({
            id: item._id,
            title: item.title,
            category: item.type === 'skill' ? 'Skill' : 'Product',
            wtk: Number(item.wtk || 0),
            dist: 0,
            user: item.owner_username,
            image: item.image || '',
            desc: item.description || '',
            location: item.location || '',
            date: item.date || ''
          }));
          setListings(mappedListings);
        }
      } catch (err) {
        // no-op
      }
    };

    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(saved)) {
        const normalized = saved
          .map((item) => {
            if (typeof item === 'string') {
              const text = item.trim();
              if (!text) return null;
              return { id: text.toLowerCase(), query: text, created_at: new Date().toISOString() };
            }
            const text = String(item?.query || '').trim();
            if (!text) return null;
            return {
              id: text.toLowerCase(),
              query: text,
              created_at: item?.created_at || new Date().toISOString()
            };
          })
          .filter(Boolean);
        const dedupMap = new Map();
        for (const item of normalized) {
          if (!dedupMap.has(item.id)) dedupMap.set(item.id, item);
        }
        setSearchHistory(Array.from(dedupMap.values()));
      }
    } catch (err) {
      setSearchHistory([]);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timeout;
    const rotateQuote = () => {
      const delay = 4500 + Math.floor(Math.random() * 2500);
      timeout = setTimeout(() => {
        setQuoteIndex((prev) => {
          if (LEGEND_QUOTES.length <= 1) return prev;
          let next = prev;
          while (next === prev) {
            next = Math.floor(Math.random() * LEGEND_QUOTES.length);
          }
          return next;
        });
        rotateQuote();
      }, delay);
    };
    rotateQuote();
    return () => clearTimeout(timeout);
  }, []);

  const query = searchQuery.trim().toLowerCase();

  const persistHistory = (next) => {
    setSearchHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const saveSearchHistory = (rawQuery) => {
    const clean = String(rawQuery || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    const nextItem = {
      id: key,
      query: clean,
      created_at: new Date().toISOString()
    };
    const deduped = searchHistory.filter((item) => item.id !== key);
    persistHistory([nextItem, ...deduped].slice(0, 50));
  };

  const removeHistoryItem = (id) => {
    const next = searchHistory.filter((item) => item.id !== id);
    persistHistory(next);
  };

  const clearAllHistory = () => {
    persistHistory([]);
    setShowClearHistoryModal(false);
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        if (!query) return true;
        const username = String(u.username || '').toLowerCase();
        const email = String(u.email || '').toLowerCase();
        const area = String(u.location || '').toLowerCase();
        const skills = Array.isArray(u.skills) ? u.skills.map((s) => String(s).toLowerCase()) : [];

        if (activeTab === 'Users') {
          return username.includes(query) || email.includes(query);
        }
        if (activeTab === 'Skills') {
          return skills.some((s) => s.includes(query));
        }
        if (activeTab === 'Area') {
          return area.includes(query);
        }
        return (
          username.includes(query) ||
          email.includes(query) ||
          area.includes(query) ||
          skills.some((s) => s.includes(query))
        );
      }),
    [users, query, activeTab]
  );

  const filteredListings = useMemo(
    () =>
      listings.filter((item) => {
        const matchesSearch =
          !query ||
          String(item.title || '').toLowerCase().includes(query) ||
          String(item.user || '').toLowerCase().includes(query) ||
          String(item.category || '').toLowerCase().includes(query) ||
          String(item.desc || '').toLowerCase().includes(query) ||
          String(item.location || '').toLowerCase().includes(query);
        const matchesDist = Number(item.dist || 0) <= Number(maxDistance);
        const matchesPrice = Number(item.wtk || 0) <= Number(maxPrice);
        return matchesSearch && matchesDist && matchesPrice;
      }),
    [listings, query, maxDistance, maxPrice]
  );

  const showUsers = activeTab === 'All' || activeTab === 'Users' || activeTab === 'Skills' || activeTab === 'Area';
  const showProducts = activeTab === 'All' || activeTab === 'Products';
  const visibleHistory = showAllHistory ? searchHistory : searchHistory.slice(0, 6);

  useEffect(() => {
    const openListingId = location.state?.openListingId;
    if (!openListingId || listings.length === 0) return;
    const match = listings.find((item) => String(item.id) === String(openListingId));
    if (!match) return;
    setSelectedItem(match);
  }, [location.state, listings]);

  const handleListingTransaction = async () => {
    if (!selectedItem?.user || !currentUsername) return;
    const amount = Number(txAmount);
    if (!amount || amount <= 0) {
      setTxStatus('Enter a valid WTK amount.');
      return;
    }
    try {
      const response = await fetch('/api/transactions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          type: 'spent',
          selectedUser: selectedItem.user,
          wtk: amount
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setTxStatus(data.message || 'Transaction failed.');
        return;
      }
      setTxStatus('Transaction completed. Added to history.');
      setTimeout(() => {
        setShowTransactionModal(false);
        setTxStatus('');
        navigate('/history');
      }, 900);
    } catch (err) {
      setTxStatus('Could not complete transaction.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-teal-600" size={20} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveSearchHistory(searchQuery);
              }
            }}
            placeholder={SEARCH_SUGGESTIONS[suggestionIndex]}
            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 outline-none ring-2 ring-transparent focus:ring-teal-500 transition-all font-bold shadow-sm dark:text-white"
          />
        </div>

        <div className="flex flex-col items-end gap-2">
          {activeTab !== 'Users' && (
            <button
              onClick={() => setShowFilters(true)}
              className={`p-5 rounded-[24px] transition-all flex items-center gap-3 shadow-lg ${showFilters ? 'bg-teal-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              <SlidersHorizontal size={24} />
              <span className="font-bold text-sm">Product Filters</span>
            </button>
          )}
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <button
              onClick={() => setShowAllHistory((prev) => !prev)}
              className="text-slate-400 hover:text-teal-600 transition-all"
            >
              {showAllHistory ? 'Show less' : 'See all'}
            </button>
            <button
              onClick={() => setShowClearHistoryModal(true)}
              className="text-slate-400 hover:text-rose-500 transition-all"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              saveSearchHistory(searchQuery);
            }}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-rose-500 via-orange-500 to-lime-700 text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-teal-400 hover:text-teal-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {searchHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Search History</p>
          <div className="flex flex-wrap gap-2">
            {visibleHistory.map((item) => (
              <div key={item.id} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5">
                <button
                  onClick={() => {
                    setSearchQuery(item.query);
                  }}
                  className="text-xs font-bold text-slate-600 dark:text-slate-200"
                >
                  {item.query}
                </button>
                <button
                  onClick={() => removeHistoryItem(item.id)}
                  className="text-slate-400 hover:text-rose-500 transition-all"
                  title="Remove search history"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showClearHistoryModal && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-7"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Clear Search History</h3>
                <button
                  onClick={() => setShowClearHistoryModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-300 font-medium">
                Do you want to clear all search history?
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowClearHistoryModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllHistory}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 z-[70] p-10 shadow-2xl space-y-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black dark:text-white">Product Filters</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 dark:text-white"><X /></button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                  <label className="flex items-center gap-2"><Navigation size={12} /> Max Distance</label>
                  <span>{maxDistance} km</span>
                </div>
                <input type="range" min="1" max="100" step="1" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} className="w-full accent-teal-600" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                  <label className="flex items-center gap-2"><Coins size={12} /> Max WTK</label>
                  <span>{maxPrice} WTK</span>
                </div>
                <input type="range" min="10" max="10000" step="10" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full accent-teal-600" />
              </div>
              <button onClick={() => { setMaxDistance(100); setMaxPrice(10000); setSearchQuery(''); }} className="w-full py-4 text-slate-400 font-bold text-xs uppercase hover:text-red-500">Reset Filters</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showUsers && (
        <section className="space-y-4">
          {!query && (
            <div className="p-2 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="max-w-3xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Wertech Inspiration</p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${quoteIndex}-${LEGEND_QUOTES[quoteIndex].author}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.35 }}
                    >
                      <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                        "{LEGEND_QUOTES[quoteIndex].text}"
                      </p>
                      <p className="mt-3 text-sm font-bold text-teal-600">- {LEGEND_QUOTES[quoteIndex].author}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <motion.div
                  animate={{ y: [0, -6, 0], rotate: [0, -3, 0, 3, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="self-start md:self-center"
                >
                  <BrandLogo size={44} withText={false} />
                </motion.div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {query && filteredUsers.map((u) => (
              <div key={u.id} className="bg-white dark:bg-slate-900 rounded-[30px] p-6 border dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                  {u.profileImage ? (
                    <img src={u.profileImage} alt={u.username} className="w-14 h-14 rounded-2xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-xl">
                      {u.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 dark:text-white truncate">{u.username}</p>
                    <p className="text-[10px] font-black uppercase text-teal-600">{u.status}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-500 space-y-1">
                  <p className="flex items-center gap-2"><Mail size={14} /> {u.email}</p>
                  <p className="flex items-center gap-2"><MapPin size={14} /> {u.location}</p>
                  <p className="text-[11px] text-teal-600 font-bold truncate">
                    Skills: {(u.skills || []).slice(0, 3).join(', ') || 'No skills'}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/profile/${encodeURIComponent(u.username)}`)}
                  className="mt-5 w-full py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-teal-600 transition-all"
                >
                  View Profile
                </button>
              </div>
            ))}
            {query && filteredUsers.length === 0 && (
              <div className="col-span-full bg-white rounded-[24px] border border-slate-100 p-8 text-center text-slate-400 font-bold">
                No users match your search.
              </div>
            )}
          </div>
        </section>
      )}

      {showProducts && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredListings.map((item) => (
                <motion.div layout key={item.id} className="bg-white dark:bg-slate-900 rounded-[40px] border dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all">
                  {item.image && (
                    <div className="h-52 overflow-hidden relative">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                      <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 px-4 py-1.5 rounded-full text-[9px] font-black text-teal-600 uppercase">{item.category}</span>
                    </div>
                  )}
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-black dark:text-white leading-tight">{item.title}</h3>
                      <p className="text-2xl font-black text-teal-600">{item.wtk}</p>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase border-t dark:border-slate-800 pt-5">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-teal-600" /> {item.dist} km</span>
                      <span className="flex items-center gap-1"><User size={12} /> {item.user}</span>
                    </div>
                    <button onClick={() => setSelectedItem(item)} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-teal-600 transition-all">View Details</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {filteredListings.length === 0 && (
            <div className="bg-white rounded-[24px] border border-slate-100 p-8 text-center text-slate-400 font-bold">
              No products match your search/filter.
            </div>
          )}
        </section>
      )}

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] overflow-hidden relative shadow-2xl border dark:border-slate-800">
              <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 z-10 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all"><X size={20} /></button>
              <div className="grid grid-cols-1 md:grid-cols-2">
                {selectedItem.image ? (
                  <img src={selectedItem.image} className="h-64 md:h-full object-cover" alt="" />
                ) : (
                  <div className="h-64 md:h-full bg-slate-100 dark:bg-slate-800" />
                )}
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
                    <div className="flex items-center gap-2">
                      {selectedItem.user !== currentUsername && (
                        <button
                          onClick={() => {
                            setTxAmount(String(selectedItem.wtk || ''));
                            setTxStatus('');
                            setShowTransactionModal(true);
                          }}
                          className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all"
                        >
                          Transaction <ArrowUpRight size={16} />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          navigate('/messages', {
                            state: {
                              shareListing: {
                                listing_id: selectedItem.id,
                                title: selectedItem.title,
                                owner_username: selectedItem.user,
                                wtk: selectedItem.wtk,
                                type: selectedItem.category === 'Skill' ? 'skill' : 'item',
                                image: selectedItem.image || '',
                                location: selectedItem.location || ''
                              }
                            }
                          })
                        }
                        className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-slate-800 transition-all"
                      >
                        Share <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => navigate('/barter-request', { state: { item: selectedItem } })}
                        className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-teal-700 transition-all"
                      >
                        Propose Trade <Zap size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTransactionModal && selectedItem && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-7"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirm Transaction</h3>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-300 font-medium">
                Send WTK to <span className="font-black text-slate-900 dark:text-white">{selectedItem.user}</span> for this listing.
              </p>
              <input
                type="number"
                min="1"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="w-full mt-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 dark:text-white outline-none"
                placeholder="Enter WTK amount"
              />
              {txStatus && (
                <p className="mt-3 text-xs font-bold text-amber-600">{txStatus}</p>
              )}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleListingTransaction}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all"
                >
                  Pay Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

