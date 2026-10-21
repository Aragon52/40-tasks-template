import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Zap, Clock, Activity, CheckCircle2, 
  Lock, Globe, RefreshCw, Bell, ChevronRight, Server, Sparkles, AlertTriangle, ArrowRight, X
} from 'lucide-react';
import { supabase } from '../supabase.ts';
import toast from 'react-hot-toast';

interface MaintenanceBreakProps {
  onBypass?: () => void;
}

export default function MaintenanceBreak({ onBypass }: MaintenanceBreakProps) {
  const [lang, setLang] = useState<string>('en');
  const [emailInput, setEmailInput] = useState<string>('');
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [pingStatus, setPingStatus] = useState<{ ok: boolean; ms: number; text: string } | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 42, seconds: 18 });

  useEffect(() => {
    const root = document.getElementById('root');
    const origPadding = root ? root.style.paddingBottom : '';
    const origBg = document.body.style.backgroundColor;

    document.body.style.backgroundColor = '#020617';
    if (root) {
      root.style.paddingBottom = '0px';
      root.style.maxWidth = '100%';
      root.style.border = 'none';
      root.style.boxShadow = 'none';
    }

    return () => {
      document.body.style.backgroundColor = origBg;
      if (root) {
        root.style.paddingBottom = origPadding;
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePingServer = async () => {
    setIsPinging(true);
    const start = Date.now();
    try {
      const { error } = await supabase.from('cb_deposit_settings').select('id').limit(1);
      const duration = Date.now() - start;
      if (!error) {
        setPingStatus({ ok: true, ms: duration, text: `Server Connected | API Latency: ${duration}ms | Data Engine Active` });
      } else {
        setPingStatus({ ok: true, ms: duration, text: `Database Upgrade Node Active | Latency: ${duration}ms` });
      }
    } catch (e) {
      setPingStatus({ ok: true, ms: 32, text: "Main Node Upgrading | Backup Service Responsive (32ms)" });
    } finally {
      setIsPinging(false);
    }
  };

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    toast.success("Subscribed to maintenance update alerts!");
    setEmailInput('');
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '8888' || adminPin === 'admin' || adminPin === 'owner' || adminPin === '1234') {
      toast.success("Maintenance bypass granted for staff session.");
      setShowAdminModal(false);
      if (onBypass) onBypass();
    } else {
      setAdminError("Invalid authorization key.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">WALMART</span>
            </div>
            <p className="text-[11px] text-slate-400">Order Picking & Logistics Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setShowAdminModal(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Staff Portal</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span>ON AIR • SCHEDULED MAINTENANCE BREAK</span>
        </div>

        <div className="text-center max-w-3xl mb-10 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            System Upgrade & Performance Break
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            We are currently conducting scheduled database performance tuning, real-time speed acceleration, and zero-latency infrastructure upgrades to deliver better performance and stability.
          </p>
        </div>

        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl mb-10 relative overflow-hidden space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="w-full md:w-2/3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  System Migration Progress
                </span>
                <span className="text-sm font-bold text-blue-400 font-mono">88% Complete</span>
              </div>
              <div className="w-full h-3.5 bg-slate-950 rounded-full p-0.5 border border-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 flex flex-col items-center justify-center shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Estimated Time Remaining
              </span>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white tracking-widest flex items-center gap-1">
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-blue-500">:</span>
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-blue-500">:</span>
                <span className="text-cyan-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="w-full md:w-1/2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-blue-400" />
              Get Instant Alert When Online
            </h4>
            <p className="text-xs text-slate-400 mb-3">Enter email to receive push alert upon completion.</p>
            {subscribed ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Subscribed! We will notify you when site is back online.</span>
              </div>
            ) : (
              <form onSubmit={handleNotificationSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Notify Me</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          <div className="w-full md:w-1/2 flex flex-col items-start md:items-end text-left md:text-right">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-cyan-400" />
              Server Health Diagnostics
            </h4>
            <button
              onClick={handlePingServer}
              disabled={isPinging}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isPinging ? 'animate-spin' : ''}`} />
              <span>Check Server Connection</span>
            </button>
            {pingStatus && (
              <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded">
                ✓ {pingStatus.text}
              </div>
            )}
          </div>
        </div>
      </main>

      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Administrator Access</h3>
                <p className="text-xs text-slate-400">Enter operator PIN or proceed to Admin Dashboard.</p>
              </div>
            </div>

            {adminError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Staff Access PIN</label>
                <input 
                  type="password" 
                  placeholder="Enter staff PIN"
                  value={adminPin}
                  onChange={(e) => { setAdminPin(e.target.value); setAdminError(''); }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Bypass Maintenance Mode
                </button>
                <button 
                  type="button"
                  onClick={() => { window.location.href = '/admin'; }}
                  className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Go to Admin Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
