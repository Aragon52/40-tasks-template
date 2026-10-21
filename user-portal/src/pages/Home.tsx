import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../components/GlobalLoader';
import { supabase } from '../supabase';
import { TrendingUp, Sparkles, Calendar, Wallet, ShieldCheck, Lock, Headphones, Zap } from 'lucide-react';

const BANNERS = [
  {
    id: 0,
    img: '/super_agent_bg.svg',
    tag: 'SUPER INTELLIGENT AGENT',
    title: 'AI Edge Order Assignment',
    sub: 'Orders have been assigned by the newly integrated Super Intelligent system agent to maximize the user\'s profitability',
    accent: '#8b5cf6',
  },
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    tag: 'EXCLUSIVE DEALS',
    title: 'Top Brands,\nMega Savings',
    sub: 'Earn commissions on every matched order',
    accent: '#0071ce',
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    tag: 'NEW ARRIVALS',
    title: 'Premium Fashion\nCollection',
    sub: 'Match orders from top lifestyle brands',
    accent: '#e11d48',
  },
  {
    id: 3,
    img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
    tag: 'TECH & GADGETS',
    title: 'Electronics\nSuper Sale',
    sub: 'High-value orders with up to 2.5% commission',
    accent: '#7c3aed',
  },
];

export default function Home({ currentTheme, balance, username, orders }: any) {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  const [profitStats, setProfitStats] = useState(() => {
    try {
      const activeUser = username || localStorage.getItem('cb_username') || '';
      const saved = localStorage.getItem(`cb_profit_stats_${activeUser}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { totalProfits: 0, todayProfit: 0, yesterdayEarn: 0 };
  });

  const [liveBalance, setLiveBalance] = useState(() => {
    const val = Number.parseFloat(String(balance ?? 0));
    return isNaN(val) ? 0 : val;
  });

  useEffect(() => {
    const val = Number.parseFloat(String(balance ?? 0));
    if (!isNaN(val)) setLiveBalance(val);
  }, [balance]);

  // Compute live profit stats and sync with Supabase cb_orders and cb_users
  useEffect(() => {
    const activeUser = username || localStorage.getItem('cb_username') || '';
    if (!activeUser) return;

    let isMounted = true;

    const computeAndSetStats = (ordersList: any[], userRecord?: any) => {
      const today = new Date();
      const todayStr = today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      let orderTotal = 0;
      let orderToday = 0;
      let orderYesterday = 0;

      ordersList.forEach((o: any) => {
        const isSuccess = String(o.status || '').toLowerCase() === 'success';
        if (!isSuccess) return;

        const p = Number.parseFloat(String(o.profit ?? '0').replace(/[$,\s]/g, '')) || 0;
        orderTotal += p;

        const dateVal = o.timestamp || o.created_at;
        const d = dateVal ? new Date(dateVal) : new Date();
        const dStr = d.toDateString();

        if (dStr === todayStr) {
          orderToday += p;
        } else if (dStr === yesterdayStr) {
          orderYesterday += p;
        }
      });

      const dbEarnings = Number.parseFloat(String(userRecord?.earnings || 0)) || 0;
      const dbCommissions = Number.parseFloat(String(userRecord?.commissions || 0)) || 0;
      const totalProfits = Math.max(orderTotal, dbEarnings, dbCommissions);

      const finalToday = orderToday > 0 ? orderToday : (orderTotal > 0 ? orderTotal : 0);
      const finalYesterday = orderYesterday;

      const newStats = {
        totalProfits: Number(totalProfits.toFixed(2)),
        todayProfit: Number(finalToday.toFixed(2)),
        yesterdayEarn: Number(finalYesterday.toFixed(2))
      };

      if (isMounted) {
        setProfitStats(newStats);
        try {
          localStorage.setItem(`cb_profit_stats_${activeUser}`, JSON.stringify(newStats));
        } catch {}
      }
    };

    if (Array.isArray(orders) && orders.length > 0) {
      computeAndSetStats(orders);
    }

    const fetchFreshData = async () => {
      try {
        const rawUser = activeUser.trim();
        const cleanUser = rawUser.replace(/^[+]/, '');

        const [ordersRes, userRes] = await Promise.all([
          supabase
            .from('cb_orders')
            .select('*')
            .or(`username.eq.${rawUser},phone.eq.${rawUser},username.eq.+${cleanUser},phone.eq.+${cleanUser}`)
            .eq('status', 'Success'),
          supabase
            .from('cb_users')
            .select('balance, earnings, commissions')
            .or(`username.eq.${rawUser},phone.eq.${rawUser},username.eq.+${cleanUser},phone.eq.+${cleanUser}`)
        ]);

        const userRow = userRes.data && userRes.data[0];
        if (userRow && typeof userRow.balance !== 'undefined') {
          const b = Number.parseFloat(String(userRow.balance));
          if (!isNaN(b) && isMounted) {
            setLiveBalance(b);
          }
        }

        const freshOrders = ordersRes.data || [];
        computeAndSetStats(freshOrders, userRow);
      } catch (err) {
        console.warn("Could not fetch fresh profit stats:", err);
      }
    };

    fetchFreshData();

    const channel = supabase
      .channel(`home_stats_${activeUser}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_orders', filter: `username=eq.${activeUser}` }, () => {
        fetchFreshData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_users', filter: `username=eq.${activeUser}` }, (payload: any) => {
        if (payload?.new && typeof payload.new.balance !== 'undefined') {
          const b = Number.parseFloat(String(payload.new.balance));
          if (!isNaN(b) && isMounted) setLiveBalance(b);
        }
        fetchFreshData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [username, orders]);

  const LIVE_COMMISSIONS = [
    { user: 'mateo***', amount: '120.00', profit: '3.00', task: 'Order Tasking' },
    { user: 'sofi***', amount: '220.00', profit: '5.50', task: 'Matching Task' },
    { user: 'luis***', amount: '480.00', profit: '12.00', task: 'VIP Order' },
    { user: 'valen***', amount: '950.00', profit: '23.75', task: 'Premium Matching' },
    { user: 'diego***', amount: '1,800.00', profit: '45.00', task: 'Matching Task' },
    { user: 'cam***', amount: '3,200.00', profit: '80.00', task: 'Order Tasking' },
    { user: 'thiag***', amount: '5,600.00', profit: '140.00', task: 'VIP Order' },
    { user: 'isab***', amount: '9,400.00', profit: '235.00', task: 'Premium Matching' },
    { user: 'gabr***', amount: '14,800.00', profit: '370.00', task: 'Matching Task' },
    { user: 'fern***', amount: '21,500.00', profit: '537.50', task: 'Order Tasking' },
    { user: 'pablo***', amount: '28,900.00', profit: '722.50', task: 'VIP Order' },
    { user: 'santi***', amount: '38,200.00', profit: '955.00', task: 'Premium Matching' },
    { user: 'mari***', amount: '51,440.00', profit: '1,286.00', task: 'Special VIP Task' },
    { user: 'lucas***', amount: '310.00', profit: '7.75', task: 'Order Tasking' },
    { user: 'javi***', amount: '1,120.00', profit: '28.00', task: 'Matching Task' },
    { user: 'carlos***', amount: '4,500.00', profit: '112.50', task: 'VIP Order' },
    { user: 'luci***', amount: '8,900.00', profit: '222.50', task: 'Premium Matching' },
    { user: 'alejo***', amount: '17,600.00', profit: '440.00', task: 'Matching Task' },
    { user: 'rafa***', amount: '32,100.00', profit: '802.50', task: 'Order Tasking' },
    { user: 'vale***', amount: '45,800.00', profit: '1,145.00', task: 'Special VIP Task' }
  ];

  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const tickerTimer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % LIVE_COMMISSIONS.length);
    }, 2800);
    return () => clearInterval(tickerTimer);
  }, [LIVE_COMMISSIONS.length]);

  // Auto-advance every 4 seconds
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Format balance
  const formattedBalance = liveBalance.toFixed(2);

  return (
    <>
      <div className="flex flex-col space-y-3.5 px-3 pt-2 pb-4 w-full scale-up">
        {/* ── 1. Top E-Commerce Banner Carousel ── */}
        <div className="ec-banner-carousel">
          {BANNERS.map((b, i) => (
            <div
              key={b.id}
              className={`ec-slide ${i === slide ? 'ec-slide-active' : ''}`}
              style={{ 
                backgroundImage: `url(${b.img}), linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)`,
                backgroundColor: '#0f172a'
              }}
            >
              {/* Dark gradient overlay */}
              <div className="ec-slide-overlay" style={{ '--accent': b.accent } as React.CSSProperties} />

              <div className="ec-slide-content">
                <span className="ec-tag" style={{ background: b.accent }}>{b.tag}</span>
                <h2 className="ec-title">{b.title}</h2>
                <p className="ec-sub">{b.sub}</p>
              </div>
            </div>
          ))}

          {/* Dot indicators */}
          <div className="ec-dots">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                className={`ec-dot ${i === slide ? 'ec-dot-active' : ''}`}
                onClick={() => setSlide(i)}
                style={i === slide ? { background: BANNERS[slide].accent, width: 20 } : {}}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="ec-progress">
            <div
              key={slide}
              className="ec-progress-bar"
              style={{ background: BANNERS[slide].accent }}
            />
          </div>
        </div>

        {/* ── 2. Balance Card ── */}
        <div className="balance-card">
          <div className="balance-user-row">
            <span className="username-text" id="lbl-username">{username}</span>
          </div>
          <div className="balance-amount-row">
            <span className="balance-currency">$</span>
            <span className="balance-value" id="lbl-balance">{formattedBalance}</span>
          </div>
          <div className="balance-label-row">
            <span className="balance-label">
              {currentTheme === 'orange' ? 'Balance' : 'Account Balance'}
            </span>
          </div>
        </div>

        {/* ── 3. Interactive Earn Banner Strip ── */}
        <div 
          className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-100/60 rounded-xl cursor-pointer hover:bg-blue-50/50 transition-colors shadow-xs"
          onClick={() => navigate('/match')}
          id="btn-start-earning"
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-[10px] font-bold shadow-xs">
              ⚡
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Earn Daily Commissions</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Match orders to boost daily yield</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/50 shadow-2xs">
            Active
          </span>
        </div>

        {/* ── 4. 4-Icon Quick Actions Grid ── */}
        <div className="grid grid-cols-4 gap-2 my-1">
          <div className="grid-item-container" onClick={() => navigate('/support')} id="btn-quick-notification">
            <div className="icon-circle">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h8" />
                <path d="M8 14h6" />
              </svg>
            </div>
            <span className="grid-label">
              {currentTheme === 'orange' ? 'Notification' : 'Notifications'}
            </span>
          </div>

          <div className="grid-item-container" onClick={() => navigate('/deposit')} id="btn-quick-deposit">
            <div className="icon-circle">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M7 10h4a2 2 0 0 1 0 4H7z" />
                <path d="M7 14h4a2 2 0 0 1 0 4H7z" />
                <path d="M9 8v12" />
              </svg>
            </div>
            <span className="grid-label">Deposit</span>
          </div>

          <div className="grid-item-container" onClick={() => navigate('/withdraw')} id="btn-quick-withdraw">
            <div className="icon-circle">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3" />
                <path d="M14 10V5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8.5a4 4 0 0 0 4 4h2a5 5 0 0 0 5-5" />
              </svg>
            </div>
            <span className="grid-label">Withdraw</span>
          </div>

          <div className="grid-item-container" onClick={() => navigate('/affiliate')} id="btn-quick-invite">
            <div className="icon-circle">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <span className="grid-label">
              {currentTheme === 'orange' ? 'Invite' : 'Invite Friends'}
            </span>
          </div>
        </div>

        {/* ── 5. Total Earnings Section ── */}
        <div className="earnings-section">
          <div className="section-title-row">
            <span className="title-indicator"></span>
            <h3 className="section-title">
              {currentTheme === 'orange' ? 'Total Earnings & Yesterday Earn' : 'Total Profits & Yesterday Earn'}
            </h3>
          </div>

          <div className="earnings-grid">
            <div className="earnings-card" id="card-total-profits">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mb-0.5">
                <TrendingUp className="w-3 h-3 shrink-0" />
                <span className="earning-label">Total Profits</span>
              </div>
              <span className="earning-value font-mono text-emerald-600 dark:text-emerald-400" id="lbl-total-profits">
                $ {profitStats.totalProfits.toFixed(2)}
              </span>
            </div>

            <div className="earnings-card" id="card-yesterday-earn">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="earning-label">Yesterday Earn</span>
              </div>
              <span className="earning-value font-mono" id="lbl-yesterday-earn" style={{ color: '#f59e0b' }}>
                $ {profitStats.yesterdayEarn.toFixed(2)}
              </span>
            </div>

            <div className="earnings-card" id="card-today-profit">
              <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 mb-0.5">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="earning-label">Today's Profit</span>
              </div>
              <span className="earning-value font-mono" id="lbl-today-profit" style={{ color: '#0284c7' }}>
                $ {profitStats.todayProfit.toFixed(2)}
              </span>
            </div>

            <div className="earnings-card" id="card-balance-display">
              <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 mb-0.5">
                <Wallet className="w-3 h-3 shrink-0" />
                <span className="earning-label">Account Balance</span>
              </div>
              <span className="earning-value font-mono text-indigo-600 dark:text-indigo-400" id="lbl-home-balance">
                $ {formattedBalance}
              </span>
            </div>
          </div>
        </div>

        {/* ── 6. Recent Commission Allocations & Super Intelligent System Agent Banner ── */}
        <div className="flex flex-col gap-3">
          {/* AI Agent Commission Banner */}
          <div className="relative overflow-hidden rounded-xl p-3 bg-slate-950 text-white border border-purple-500/30 shadow-md shadow-purple-950/10 group">
            {/* Visual Graphic Image Background */}
            <img 
              src="/super_agent_bg.svg" 
              alt="Super Intelligent System Agent Visual Graphic" 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-70 group-hover:scale-105 transition-transform duration-700 pointer-events-none" 
            />
            {/* Readability Vignette & Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-purple-950/75 to-indigo-950/60 pointer-events-none" />
            <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30 uppercase tracking-wider">
                    Super Intelligent System Agent
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Active Optimization
                  </span>
                </div>
                <p className="text-xs font-medium text-purple-100 leading-snug">
                  Orders have been assigned by the newly integrated Super Intelligent system agent to maximize profitability.
                </p>
              </div>
            </div>
          </div>

          {/* ── Sliding Commission Collection Announcement Banner (Downward to Upward) ── */}
          <div className="live-feed-card overflow-hidden p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
            <div className="feed-header flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="pulse-indicator"></span>
                <span className="feed-title text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recent Commission Allocations</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/40">
                Live Feed
              </span>
            </div>

            {/* Downward to Upward Sliding Ticket Reel */}
            <div className="relative h-9 overflow-hidden bg-slate-50/80 dark:bg-slate-950/60 rounded-lg px-2.5 border border-slate-100 dark:border-slate-800/80">
              <div 
                className="absolute inset-x-2.5 transition-transform duration-500 ease-in-out flex flex-col"
                style={{ transform: `translateY(-${tickerIndex * 36}px)` }}
              >
                {LIVE_COMMISSIONS.map((item, idx) => (
                  <div key={idx} className="h-9 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200 shrink-0">
                    <span className="flex items-center gap-1.5 truncate text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>User <strong className="text-slate-900 dark:text-slate-100 font-bold">{item.user}</strong> matched {item.task} for <strong className="text-sky-600 dark:text-sky-400 font-bold">${item.amount}</strong></span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1.5 shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">
                      +${item.profit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 7. Platform Trust & Guarantee Footer Card (Verified System green box removed) ── */}
          <div className="mt-0.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Official Platform Guarantee</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center gap-0.5">
                <Lock className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">256-Bit SSL</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center gap-0.5">
                <Headphones className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">24/7 Support</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center gap-0.5">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">Fast Settlement</span>
              </div>
            </div>

            <div className="text-center pt-0.5">
              <p className="text-[9px] text-slate-400 font-medium">
                Walmart Marketplace © 2026 • All Rights Reserved
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .home-container {
          display: flex;
          flex-direction: column;
          padding: 24px 20px;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        .home-grid-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ─── E-Commerce Banner Carousel ─── */
        .ec-banner-carousel {
          position: relative;
          height: 172px;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 18px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.28);
        }

        .ec-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 0.7s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .ec-slide-active {
          opacity: 1;
          z-index: 1;
        }

        .ec-slide-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.08) 0%,
            rgba(0,0,0,0.65) 100%
          );
        }

        .ec-slide-content {
          position: relative;
          z-index: 2;
          padding: 0 16px 36px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ec-tag {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          color: white;
          padding: 3px 8px;
          border-radius: 3px;
          width: fit-content;
          text-transform: uppercase;
        }

        .ec-title {
          font-size: 20px;
          font-weight: 800;
          color: white;
          line-height: 1.25;
          white-space: pre-line;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
          letter-spacing: -0.3px;
        }

        .ec-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.88);
          font-weight: 400;
        }

        .ec-dots {
          position: absolute;
          bottom: 14px;
          right: 14px;
          display: flex;
          gap: 5px;
          z-index: 3;
          align-items: center;
        }

        .ec-dot {
          width: 6px;
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.4);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }

        .ec-dot-active {
          height: 6px;
          border-radius: 3px;
        }

        .ec-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255,255,255,0.15);
          z-index: 3;
        }

        .ec-progress-bar {
          height: 3px;
          border-radius: 0 2px 2px 0;
          animation: ec-progress-anim 4s linear forwards;
        }

        @keyframes ec-progress-anim {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* ─── Legacy banner classes kept for safety ─── */
        .banner-blue-classic, .banner-blue-modern {
          display: none;
        }

        /* Balance Card */
        .balance-card {
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 5;
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        /* Ambient glowing circles inside balance card */
        .balance-card::before {
          content: '';
          position: absolute;
          top: -30%;
          right: -20%;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .balance-card::after {
          content: '';
          position: absolute;
          bottom: -40%;
          left: -10%;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .balance-user-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 1;
        }

        .username-text {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .balance-amount-row {
          display: flex;
          align-items: baseline;
          color: #ffffff;
          z-index: 1;
          margin-top: 4px;
        }

        .balance-currency {
          font-size: 24px;
          font-weight: 600;
          margin-right: 6px;
          color: #f59e0b; /* Golden Yellow Currency Symbol */
          text-shadow: 0 2px 10px rgba(245, 158, 11, 0.3);
        }

        .balance-value {
          font-size: clamp(30px, 8vw, 40px);
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1;
          background: linear-gradient(to right, #ffffff, #f3f4f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .balance-label-row {
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          z-index: 1;
          margin-top: 4px;
        }

        /* Action Button */
        .earn-action-btn {
          margin: 18px 0;
          height: 52px;
          border-radius: 26px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.5px;
          box-shadow: 0 8px 20px -4px rgba(3, 105, 161, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        @media (max-width: 380px) {
          .home-container {
            padding: 12px;
          }

          .balance-card {
            padding: 18px;
          }

          .balance-value {
            font-size: 30px;
          }

          .balance-currency {
            font-size: 20px;
          }

          .icon-grid {
            gap: 8px;
          }
        }

        /* Hover slide highlight */
        .earn-action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          transition: all 0.75s ease;
        }

        .earn-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -4px rgba(3, 105, 161, 0.5);
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        }

        .earn-action-btn:hover::before {
          left: 125%;
        }

        .earn-action-btn:active {
          transform: translateY(1px);
          box-shadow: 0 4px 12px -4px rgba(3, 105, 161, 0.4);
        }

        /* Icon Grid */
        .icon-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .grid-item-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .grid-item-container:hover {
          transform: translateY(-2px);
        }

        .icon-circle {
          width: 52px;
          height: 52px;
          border-radius: 14px; /* Squircle design */
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.05);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 6px;
        }

        .grid-item-container:hover .icon-circle {
          background: rgba(0, 113, 206, 0.04);
          border-color: rgba(0, 113, 206, 0.25);
          box-shadow: 0 6px 16px rgba(0, 113, 206, 0.08);
          transform: scale(1.04);
        }

        .grid-item-container:active {
          transform: scale(0.95);
        }

        .icon-circle svg {
          stroke: var(--primary-color);
          transition: transform 0.2s;
        }

        .grid-item-container:hover .icon-circle svg {
          transform: rotate(4deg) scale(1.05);
        }

        .grid-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          text-align: center;
          margin-top: 2px;
        }

        /* Earnings Section */
        .earnings-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .title-indicator {
          width: 4px;
          height: 16px;
          background: #f59e0b;
          border-radius: 2px;
        }

        .section-title {
          font-size: 14px;
          color: var(--text-main);
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .earnings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .earnings-card {
          background-color: var(--bg-card);
          border-radius: 16px;
          padding: 16px; /* p-4 minimum */
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px; /* gap-3 feel */
          transition: all 0.2s;
        }

        .earnings-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .earning-value {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .earning-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          text-align: center;
        }

        /* Live Feed */
        .live-feed-card {
          background-color: var(--bg-card);
          border-radius: 16px;
          padding: 16px; /* p-4 minimum */
          box-shadow: var(--shadow-card);
          border-left: 4px solid var(--success-color);
        }

        .feed-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .pulse-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--success-color);
          animation: feedPulse 1.5s infinite;
        }

        .feed-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .feed-content {
          font-size: 12px;
          color: var(--text-main);
        }

        @keyframes feedPulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }

        @media (min-width: 768px) {
          .home-container {
            padding: 24px 32px;
          }

          .ec-banner-carousel {
            height: 220px;
          }

          .balance-card {
            padding: 28px;
          }

          .balance-value {
            font-size: clamp(36px, 4vw, 44px);
          }
        }

        @media (min-width: 1024px) {
          .ec-banner-carousel {
            height: 240px;
          }
        }
      `}</style>
    </>
  );
}
