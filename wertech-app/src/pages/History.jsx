import React from 'react';
import { ArrowLeft, Clock, CheckCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const navigate = useNavigate();

  const transactions = [
    { id: 1, type: 'earned', title: 'Community Cleaning Drive', wtk: 50, date: 'Yesterday', status: 'Completed' },
    { id: 2, type: 'spent', title: 'Power Drill Rental', wtk: 40, date: '2 days ago', status: 'Completed' },
    { id: 3, type: 'earned', title: 'Math Tutoring', wtk: 120, date: '1 week ago', status: 'Completed' }
  ];

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-teal-600 transition-all">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div>
        <h1 className="text-4xl font-black text-slate-900">Transaction History</h1>
        <p className="text-slate-500 font-medium">Tracking your skill exchanges and token flow.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
        {transactions.map((t, i) => (
          <div key={t.id} className={`p-8 flex items-center justify-between ${i !== transactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.type === 'earned' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                {t.type === 'earned' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{t.title}</h4>
                <p className="text-slate-400 text-sm font-medium flex items-center gap-1"><Clock size={14}/> {t.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black ${t.type === 'earned' ? 'text-green-600' : 'text-slate-900'}`}>
                {t.type === 'earned' ? '+' : '-'}{t.wtk} <span className="text-xs uppercase">WTK</span>
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded-full mt-1">
                <CheckCircle size={10}/> {t.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}