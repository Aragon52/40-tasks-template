import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { 
  Menu,
  RefreshCw, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';

interface AdminSession {
  role: string;
  name?: string;
  email?: string;
  accountId?: string;
}

interface NavbarProps {
  activeLabel: string;
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
  session?: AdminSession | null;
  onLogout: () => void;
}

export default function Navbar({ 
  activeLabel, 
  onToggleSidebar, 
  isCollapsed,
  session, 
  onLogout 
}: NavbarProps) {
  const [pendingDeposits, setPendingDeposits] = useState<number>(0);
  const [pendingWithdraws, setPendingWithdraws] = useState<number>(0);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [isMaintenance, setIsMaintenance] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cb_maintenance_mode');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleMaintenance = () => {
    const nextState = !isMaintenance;
    setIsMaintenance(nextState);
    try {
      localStorage.setItem('cb_maintenance_mode', nextState ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('cb_maintenance_updated', { detail: { active: nextState } }));
      
      const channel = supabase.channel('system_maintenance');
      channel.send({
        type: 'broadcast',
        event: 'maintenance_toggle',
        payload: { active: nextState }
      });
    } catch (e) {
      console.warn("Broadcast error", e);
    }
  };

  const syncStats = async () => {
    try {
      const { count: depCount, error: depError } = await supabase
        .from('cb_deposits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      const { count: wthCount, error: wthError } = await supabase
        .from('cb_withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      const { count: online, error: onlineError } = await supabase
        .from('cb_users')
        .select('*', { count: 'exact', head: true })
        .eq('online', 'Online');

      if (!depError) setPendingDeposits(depCount || 0);
      if (!wthError) setPendingWithdraws(wthCount || 0);
      if (!onlineError) setOnlineCount(online || 0);

      const savedSession = localStorage.getItem('cb_admin_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const table = parsed.role === 'Staff' ? 'cb_staff' : 'cb_admins';
        const { data: userData } = await supabase.from(table).select('profile_photo').eq('email', parsed.email).single();
        if (userData?.profile_photo) setProfilePhoto(userData.profile_photo);
      }
    } catch (err) {
      console.error("Error syncing stats from database:", err);
    }
  };

  useEffect(() => {
    syncStats();
    const interval = setInterval(() => {
      if (document.hidden) return;
      syncStats();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async () => {
    setIsRefreshing(true);
    await syncStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="admin-navbar w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between text-slate-800 dark:text-white shrink-0 sticky top-0 z-40 shadow-xs flex-nowrap">
      {/* Left: Sidebar Toggle Button & Current Page Label */}
      <div className="flex items-center gap-3 min-w-0 flex-nowrap">
        <button 
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Brand logo visible on mobile when sidebar is hidden */}
        <div className="admin-navbar-brand md:hidden flex items-center shrink-0">
          <img 
            src="/WALMARK.png" 
            alt="Walmark" 
            className="h-7 w-auto max-w-[88px] sm:max-w-[120px] object-contain rounded"
          />
        </div>

        <h1 className="admin-navbar-title font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md">
          {activeLabel}
        </h1>
      </div>

      {/* Right: Operational Status Badges, System Controls, Admin Session */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">
        {/* Real-time Indicator Badges */}
        <div className="hidden xl:flex items-center gap-2 flex-nowrap">
          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> 
            <span>{pendingDeposits} Deposits</span>
          </div>
          <div className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> 
            <span>{pendingWithdraws} Withdraws</span>
          </div>
          <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 
            <span>{onlineCount} Online</span>
          </div>
        </div>

        {/* Sync Data */}
        <button 
          className="p-2 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0" 
          onClick={handleUpdate}
          title="Refresh system data"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Sync</span>
        </button>
        
        {/* Maintenance Toggle */}
        <button 
          onClick={toggleMaintenance}
          title={isMaintenance ? "Click to turn Maintenance Mode OFF" : "Click to put site on Maintenance Break"}
          className={`p-2 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            isMaintenance 
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${isMaintenance ? 'bg-indigo-500 shadow-[0_0_8px_#818cf8]' : 'bg-slate-400'}`} />
          <span className="hidden md:inline whitespace-nowrap">{isMaintenance ? 'ON AIR: Maintenance' : 'Maintenance OFF'}</span>
        </button>

        {/* Quick link to User Portal */}
        <a 
          href="/?portal=user"
          title="Open User Portal"
          className="p-2 sm:px-3 sm:py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <ExternalLink size={14} />
          <span className="hidden lg:inline whitespace-nowrap">User Portal</span>
        </a>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-500 overflow-hidden flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Admin" className="w-full h-full object-cover" />
            ) : (
              <span>{session?.role ? session.role[0] : 'O'}</span>
            )}
          </div>
          <div className="hidden 2xl:flex flex-col text-left leading-none space-y-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{session?.name || 'System Owner'}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{session?.role || 'Owner'}</span>
          </div>
          <button 
            onClick={onLogout} 
            title="Sign Out"
            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
