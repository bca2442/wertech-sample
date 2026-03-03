import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Coins, MapPin, Share2, Zap, ArrowUpRight, X } from 'lucide-react';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem('username') || '';
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');

  useEffect(() => {
    const loadListing = async () => {
      if (!id) {
        setError('Missing listing id');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/listings/${encodeURIComponent(id)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || 'Could not load listing');
        }
        setListing(data);
      } catch (err) {
        setError(err?.message || 'Could not load listing');
      } finally {
        setLoading(false);
      }
    };
    loadListing();
  }, [id]);

  const handleListingTransaction = async () => {
    if (!listing?.owner_username || !currentUsername) return;
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
          selectedUser: listing.owner_username,
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

  if (loading) {
    return <div className="p-10 text-sm font-bold text-slate-400">Loading listing...</div>;
  }

  if (error || !listing) {
    return (
      <div className="p-10 space-y-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-teal-600">
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-sm font-bold text-rose-600">{error || 'Listing not found'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-4 sm:p-8">
      {listing.image ? (
        <img src={listing.image} alt={listing.title} className="w-full aspect-square object-cover rounded-[40px] shadow-inner bg-slate-100" />
      ) : (
        <div className="aspect-square bg-slate-200 rounded-[40px] shadow-inner" />
      )}

      <div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-teal-600 mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        <span className="text-teal-600 font-bold uppercase tracking-widest text-xs">
          {listing.type === 'skill' ? 'Skill Exchange' : 'Item Exchange'}
        </span>
        <h1 className="text-4xl font-black text-slate-900 mt-2 mb-4">{listing.title}</h1>
        <p className="text-slate-500 mb-6">{listing.description || 'No description provided.'}</p>

        <div className="bg-white p-6 rounded-3xl border mb-8 space-y-3">
          <p className="font-bold text-slate-800 inline-flex items-center gap-2"><Coins size={16} /> {Number(listing.wtk || 0)} WTK</p>
          <p className="text-slate-600 inline-flex items-center gap-2"><MapPin size={16} /> {listing.location || 'Unknown location'}</p>
          <p className="text-xs font-black uppercase text-slate-400">Owner: {listing.owner_username}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {listing.owner_username !== currentUsername && (
            <button
              onClick={() => {
                setTxAmount(String(listing.wtk || ''));
                setTxStatus('');
                setShowTransactionModal(true);
              }}
              className="py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm inline-flex justify-center items-center gap-2 hover:bg-emerald-700"
            >
              <ArrowUpRight size={16} /> Transaction
            </button>
          )}
          <button
            onClick={() => navigate('/barter-request', { state: { item: listing } })}
            className="py-4 rounded-2xl bg-teal-600 text-white font-black text-sm inline-flex justify-center items-center gap-2 hover:bg-teal-700"
          >
            <Zap size={16} /> Propose Trade
          </button>
          <button
            onClick={() => navigate('/messages', { state: { targetUsername: listing.owner_username } })}
            className="py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800"
          >
            Message Owner
          </button>
          <button
            onClick={() => navigate('/messages', {
              state: {
                shareListing: {
                  listing_id: listing._id,
                  title: listing.title,
                  owner_username: listing.owner_username,
                  wtk: listing.wtk,
                  type: listing.type === 'skill' ? 'skill' : 'item',
                  image: listing.image || '',
                  location: listing.location || ''
                }
              }
            })}
            className="py-4 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm inline-flex justify-center items-center gap-2 hover:bg-slate-200"
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      {showTransactionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[32px] bg-white border border-slate-100 shadow-2xl p-7">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-900">Confirm Transaction</h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Send WTK to <span className="font-black text-slate-900">{listing.owner_username}</span> for this listing.
            </p>
            <input
              type="number"
              min="1"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              className="w-full mt-4 p-4 rounded-2xl bg-slate-100 outline-none"
              placeholder="Enter WTK amount"
            />
            {txStatus && (
              <p className="mt-3 text-xs font-bold text-amber-600">{txStatus}</p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTransactionModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
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
          </div>
        </div>
      )}
    </div>
  );
}

