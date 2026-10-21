import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Search,
  Wallet,
  History,
  Info
} from 'lucide-react';
import { Card, Badge } from '@/src/shared/UI';

interface TransactionLogsProps {
  username: string;
}

export default function TransactionLogs({ username }: TransactionLogsProps) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    async function fetchLogs() {
      if (!username) return;
      setLoading(true);

      try {
        const [depRes, withRes] = await Promise.all([
          supabase.from('cb_deposits').select('*').eq('username', username),
          supabase.from('cb_withdrawals').select('*').eq('username', username)
        ]);

        const formattedDeposits = (depRes.data || []).map(d => ({
          id: d.id || `DEP-${Math.floor(Math.random() * 100000)}`,
          type: 'Deposit',
          amount: d.amount,
          status: d.status,
          timestamp: d.created_at || d.timestamp,
          method: d.method || d.currency || 'USDT TRC20',
          wallet: d.wallet_address || d.transaction_hash
        }));

        const formattedWithdrawals = (withRes.data || []).map(w => ({
          id: w.id || `WIT-${Math.floor(Math.random() * 100000)}`,
          type: 'Withdrawal',
          amount: w.amount,
          status: w.status,
          timestamp: w.created_at || w.timestamp,
          method: w.method || 'USDT TRC20',
          wallet: w.wallet_address || w.account_info
        }));

        const combined = [...formattedDeposits, ...formattedWithdrawals].sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        setLogs(combined);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [username]);

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'All') return true;
    return log.type === activeTab.slice(0, -1); // Deposits -> Deposit
  });

  const getStatusBadge = (status: string) => {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'approved' || s === 'success') return <Badge variant="success">Finished</Badge>;
    if (s === 'rejected' || s === 'failed') return <Badge variant="error">Rejected</Badge>;
    return <Badge variant="warning">Pending</Badge>;
  };

  return (
    <div className="min-h-screen bg-brand-ivory dark:bg-slate-950 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Transaction Logs</h1>
          <div className="w-9" />
        </div>

        {/* Tab Bar */}
        <div className="max-w-xl mx-auto px-4 flex gap-2 h-14 items-center">
          {['All', 'Deposits', 'Withdrawals'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 h-9 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Syncing Ledger</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-premium">
              <Search className="w-8 h-8 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-400">No records found</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">Complete a transaction to see it here</p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="p-4 hover:border-blue-100 dark:hover:border-blue-900 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  {getStatusBadge(log.status)}
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black font-mono leading-none ${log.type === 'Deposit' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    {log.type === 'Deposit' ? '+' : '-'}${parseFloat(log.amount || 0).toFixed(2)}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">USD Settlement</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.type === 'Deposit' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'}`}>
                  {log.type === 'Deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">{log.type} via {log.method}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{log.wallet || 'Internal Ledger Allocation'}</p>
                </div>
              </div>
            </Card>
          ))
        )}

        {!loading && filteredLogs.length > 0 && (
          <div className="py-8 flex flex-col items-center gap-2 text-slate-300">
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <p className="text-[9px] font-bold uppercase tracking-widest">End of Ledger</p>
          </div>
        )}
      </div>
    </div>
  );
}
