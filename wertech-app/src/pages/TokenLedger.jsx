import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Zap, ArrowUpRight, ArrowDownLeft, Wallet, Clock3 } from 'lucide-react';
import { showToast } from '../utils/toast';
import { getApiMessage, toastError } from '../utils/feedback';

function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

export default function TokenLedger() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadLedger = async () => {
      if (!username) {
        setLoading(false);
        return;
      }
      setError('');
      try {
        const [walletRes, txRes] = await Promise.all([
          fetch(`/api/users/${encodeURIComponent(username)}/wallet`),
          fetch(`/api/transactions/user/${encodeURIComponent(username)}`)
        ]);
        const [walletData, txData] = await Promise.all([walletRes.json(), txRes.json()]);

        if (walletRes.ok) {
          setBalance(Number(walletData?.wtk_balance || 0));
        }
        if (txRes.ok && Array.isArray(txData)) {
          setTransactions(txData);
        } else {
          setTransactions([]);
          if (!txRes.ok) {
            setError(getApiMessage(txData, 'Could not load transaction history.'));
          }
        }
      } catch (err) {
        setTransactions([]);
        setError('Could not load ledger. Please retry.');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadLedger();
    const timer = setInterval(loadLedger, 5000);
    return () => clearInterval(timer);
  }, [username, reloadKey]);

  const summary = useMemo(() => {
    let earned = 0;
    let spent = 0;
    for (const t of transactions) {
      const value = Number(t?.wtk || 0);
      if (String(t?.type || '').toLowerCase() === 'spent') spent += value;
      if (String(t?.type || '').toLowerCase() === 'earned') earned += value;
    }
    return { earned, spent };
  }, [transactions]);

  const handleDownloadStatement = () => {
    if (!transactions.length) {
      showToast('No transactions available to export.', 'info');
      return;
    }

    const rows = [
      ['date', 'type', 'title', 'wtk', 'status'],
      ...transactions.map((t) => [
        new Date(t.created_at || Date.now()).toISOString(),
        String(t.type || ''),
        String(t.title || '').replaceAll(',', ' '),
        String(t.wtk || 0),
        String(t.status || '')
      ])
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wertech-ledger-${username || 'user'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Ledger statement downloaded.', 'success');
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-7 md:p-8 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-3">Current Wallet Balance</p>
          <div className="flex items-baseline gap-4">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-none">{formatNumber(balance)}</h2>
            <span className="text-lg md:text-xl font-medium text-slate-400">WTK</span>
          </div>

          <div className="flex flex-wrap gap-3 mt-7">
            <button
              onClick={() => navigate('/explore')}
              className="bg-cyan-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-600 transition-all active:scale-95"
            >
              <Zap size={16} className="text-white" /> Spend on Explore
            </button>

            <button
              onClick={handleDownloadStatement}
              className="border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
            >
              <Download size={16} /> Download CSV
            </button>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <ArrowDownLeft size={14} className="text-emerald-500" /> Earned
              </p>
              <h3 className="text-3xl font-black text-emerald-600">+{formatNumber(summary.earned)} WTK</h3>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <ArrowUpRight size={14} className="text-rose-500" /> Spent
              </p>
              <h3 className="text-3xl font-black text-rose-600">-{formatNumber(summary.spent)} WTK</h3>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 text-xs font-bold text-slate-500 flex items-center gap-2">
            <Wallet size={14} /> Synced from your live wallet and transaction history.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-7 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Ledger Entries</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{transactions.length} records</p>
        </div>

        {loading && (
          <div className="p-10 text-center text-sm font-bold text-slate-400">Loading ledger...</div>
        )}
        {!loading && error && (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-bold text-rose-500">{error}</p>
            <button
              onClick={() => {
                toastError('Retrying ledger sync...');
                setReloadKey((prev) => prev + 1);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-700 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="p-10 text-center text-sm font-bold text-slate-400">No transactions found.</div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 uppercase text-[10px] font-black text-slate-400">
                <tr>
                  <th className="p-5">Type</th>
                  <th className="p-5">Title</th>
                  <th className="p-5">Amount</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const spent = String(t.type || '').toLowerCase() === 'spent';
                  return (
                    <tr key={t._id || `${t.title}-${t.created_at}`} className="border-t border-slate-50">
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${spent ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {spent ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                          {spent ? 'Spent' : 'Earned'}
                        </span>
                      </td>
                      <td className="p-5 font-bold text-slate-800">{t.title || 'Transaction'}</td>
                      <td className={`p-5 font-black ${spent ? 'text-slate-800' : 'text-emerald-600'}`}>
                        {spent ? '-' : '+'}{formatNumber(t.wtk)} WTK
                      </td>
                      <td className="p-5 text-xs font-black uppercase text-teal-600">{t.status || 'Completed'}</td>
                      <td className="p-5 text-xs font-bold text-slate-400 inline-flex items-center gap-2">
                        <Clock3 size={12} />
                        {t.created_at ? new Date(t.created_at).toLocaleString() : t.date || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

