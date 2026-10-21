import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Briefcase, TrendingUp, Activity } from 'lucide-react';
import Sidebar from './components/Sidebar.tsx';
import Navbar from './components/Navbar.tsx';
import UserManagement from './pages/UserManagement.tsx';
import SLAOwnership from './pages/SLAOwnership.tsx';
import SLAAdmins from './pages/SLAAdmins.tsx';
import SLAStaff from './pages/SLAStaff.tsx';
import FinancialCenter from './pages/FinancialCenter.tsx';
import OrdersTasking from './pages/OrdersTasking.tsx';
import TemplatesSummary from './pages/TemplatesSummary.tsx';
import OrdersInProgress from './pages/OrdersInProgress.tsx';
import Settings from './pages/Settings.tsx';
import SupportChat from './pages/SupportChat.tsx';
import Login from './pages/Login.tsx';
import { supabase } from './supabase.ts';
import { Toaster } from 'react-hot-toast';
import { motion } from 'motion/react';
import DevPortalSwitcher from './components/DevPortalSwitcher.tsx';

interface AdminSession {
  role: string;
  name?: string;
  email?: string;
  accountId?: string;
  permissions?: {
    userManagement?: boolean;
    ordersInProgress?: boolean;
    orderTasking?: boolean;
    financialCenter?: boolean;
    supportChat?: boolean;
  };
}

interface DashboardStats {
  payoutRequests: number;
  totalDeposits: number;
  newUsers: number;
  matchedTasks: number;
  onlineUsers: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [session, setSession] = useState<AdminSession | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    payoutRequests: 0,
    totalDeposits: 0,
    newUsers: 0,
    matchedTasks: 0,
    onlineUsers: 0
  });

  const loadSession = async () => {
    const saved = localStorage.getItem('cb_admin_session');
    if (saved) {
      try {
        const parsed: AdminSession = JSON.parse(saved);
        if (parsed.role === 'Staff') {
          const { data, error } = await supabase
            .from('cb_staff')
            .select('profile_photo')
            .eq('staff_id', parsed.accountId)
            .single();
          if (!error && data) {
            let perms = {
              userManagement: true,
              ordersInProgress: true,
              orderTasking: false,
              financialCenter: false,
              supportChat: false
            };
            if (data.profile_photo) {
              try {
                const parsedPerms = JSON.parse(data.profile_photo);
                if (parsedPerms && typeof parsedPerms === 'object') {
                  perms = { ...perms, ...parsedPerms };
                }
              } catch (e) {}
            }
            parsed.permissions = perms;
            localStorage.setItem('cb_admin_session', JSON.stringify(parsed));
          }
        }
        setSession(parsed);
      } catch (err) {
        console.error("Invalid session JSON stored, clearing:", err);
        localStorage.removeItem('cb_admin_session');
        setSession(null);
      }
    } else {
      setSession(null);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const { data: withdrawals, error: wthError } = await supabase
        .from('cb_withdrawals')
        .select('amount')
        .eq('status', 'Approved');
      
      let payoutSum = 0;
      if (!wthError && withdrawals) {
        payoutSum = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
      }

      const { data: deposits, error: depError } = await supabase
        .from('cb_deposits')
        .select('amount')
        .eq('status', 'Approved');

      let depositSum = 0;
      if (!depError && deposits) {
        depositSum = deposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
      }

      const { count: usersCount } = await supabase
        .from('cb_users')
        .select('*', { count: 'exact', head: true });

      const { count: ordersCount } = await supabase
        .from('cb_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Success');

      const { count: onlineCount } = await supabase
        .from('cb_users')
        .select('*', { count: 'exact', head: true })
        .eq('online', 'Online');

      setStats({
        payoutRequests: payoutSum,
        totalDeposits: depositSum,
        newUsers: usersCount || 0,
        matchedTasks: ordersCount || 0,
        onlineUsers: onlineCount || 0
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  };

  useEffect(() => {
    loadSession();
    fetchDashboardStats();
    const interval = setInterval(() => {
      if (document.hidden) return;
      loadSession();
      fetchDashboardStats();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (session) {
      if (session.role === 'Staff') {
        const perms = session.permissions || {
          userManagement: true,
          ordersInProgress: true,
          orderTasking: false,
          financialCenter: false,
          supportChat: false
        };
        
        if (['ownership', 'sla-admins', 'settings'].includes(activeTab)) {
          setActiveTab('dashboard');
        } else if (activeTab === 'user-management' && !perms.userManagement) {
          setActiveTab('dashboard');
        } else if (activeTab === 'orders-tasking' && !perms.orderTasking) {
          setActiveTab('dashboard');
        } else if (activeTab === 'templates-summary' && !perms.orderTasking) {
          setActiveTab('dashboard');
        } else if (activeTab === 'orders-in-progress' && !perms.ordersInProgress) {
          setActiveTab('dashboard');
        } else if (activeTab === 'financial-center' && !perms.financialCenter) {
          setActiveTab('dashboard');
        } else if (activeTab === 'support-chat' && !perms.supportChat) {
          setActiveTab('dashboard');
        }
      } else if (session.role === 'Admin') {
        if (['ownership'].includes(activeTab)) {
          setActiveTab('dashboard');
        }
      }
    }
  }, [session, activeTab]);

  const getActiveTabLabel = (): string => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'ownership': return 'SLA System Ownership';
      case 'sla-admins': return 'SLA Administrator Nodes';
      case 'sla-staff': return 'SLA Staff Members';
      case 'user-management': return 'User Management';
      case 'orders-tasking': return 'Orders Tasking & Allocations';
      case 'templates-summary': return 'Presets Matrix & Verification';
      case 'orders-in-progress': return 'Orders In Progress';
      case 'financial-center': return 'Financial Center';
      case 'support-chat': return 'Support & Chat Inbox';
      case 'settings': return 'System Settings';
      case 'my-profile': return 'My Profile';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'user-management':
        return <UserManagement />;

      case 'orders-tasking':
        return <OrdersTasking />;
        
      case 'templates-summary':
        return <TemplatesSummary />;
        
      case 'orders-in-progress':
        return <OrdersInProgress />;
        
      case 'ownership':
        return <SLAOwnership />;
        
      case 'sla-admins':
        return <SLAAdmins />;
        
      case 'sla-staff':
        return <SLAStaff />;

      case 'financial-center':
        return <FinancialCenter />;
        
      case 'dashboard': {
        const statCards = [
          {
            id: 'payouts',
            label: 'Total Payouts',
            value: `$ ${stats.payoutRequests.toFixed(2)}`,
            icon: DollarSign,
            iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            iconBorder: 'border-indigo-100 dark:border-indigo-900/40',
            tag: 'Platform Settled',
            tagColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
          },
          {
            id: 'deposits',
            label: 'Total Deposits',
            value: `$ ${stats.totalDeposits.toFixed(2)}`,
            icon: TrendingUp,
            iconBg: 'bg-sky-50 dark:bg-sky-950/50',
            iconColor: 'text-sky-600 dark:text-sky-400',
            iconBorder: 'border-sky-100 dark:border-sky-900/40',
            tag: 'Inflow Audited',
            tagColor: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40'
          },
          {
            id: 'users',
            label: 'Client Nodes',
            value: stats.newUsers.toLocaleString(),
            icon: Users,
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            iconBorder: 'border-emerald-100 dark:border-emerald-900/40',
            tag: 'Registered',
            tagColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
          },
          {
            id: 'tasks',
            label: 'Matched Tasks',
            value: stats.matchedTasks.toLocaleString(),
            icon: Briefcase,
            iconBg: 'bg-amber-50 dark:bg-amber-950/50',
            iconColor: 'text-amber-600 dark:text-amber-400',
            iconBorder: 'border-amber-100 dark:border-amber-900/40',
            tag: 'Active Matrix',
            tagColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
          },
          {
            id: 'online',
            label: 'Online Users',
            value: stats.onlineUsers.toLocaleString(),
            icon: Activity,
            iconBg: 'bg-rose-50 dark:bg-rose-950/50',
            iconColor: 'text-rose-600 dark:text-rose-400',
            iconBorder: 'border-rose-100 dark:border-rose-900/40',
            tag: 'Live Sessions',
            tagColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
          }
        ];

        return (
          <div className="admin-page-container space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Overview Dashboard</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time financial metrics and operational node activity.</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4.5">
              {statCards.map((card, idx) => {
                const IconComp = card.icon;
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.45, 
                      delay: idx * 0.08, 
                      ease: [0.21, 0.47, 0.32, 0.98] 
                    }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="admin-card !p-5 sm:!p-6 !mb-0 flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:shadow-md transition-all duration-200 cursor-default"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          {card.label}
                        </span>
                        <span className="text-xl sm:text-2xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white block">
                          {card.value}
                        </span>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${card.iconBg} ${card.iconColor} ${card.iconBorder} shadow-2xs`}>
                        <IconComp size={20} />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${card.tagColor}`}>
                        {card.tag}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.42, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="admin-card !p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Platform Earning Velocity Matrix
                </h3>
              </div>
              <div className="h-60 flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-slate-400">
                <TrendingUp size={36} className="mb-2.5 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                <span className="font-medium text-xs">Real-time Analytics Feed Active</span>
              </div>
            </motion.div>
          </div>
        );
      }

      case 'support-chat':
        return <SupportChat />;

      case 'settings':
        return <Settings />;

      default:
        return (
          <div className="admin-page-container">
            <div className="admin-card">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{getActiveTabLabel()}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This portal subsection configures administrative bindings.
              </p>
            </div>
          </div>
        );
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cb_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('cb_admin_sidebar_collapsed', next ? 'true' : 'false');
        } catch (e) {}
        return next;
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    localStorage.removeItem('cb_admin_session');
    setSession(null);
    window.location.reload();
  };

  if (!session) {
    return (
      <>
        <DevPortalSwitcher currentPortal="admin" />
        <Login onLoginSuccess={(s) => setSession(s)} />
      </>
    );
  }

  return (
    <div className="h-screen h-dvh w-screen w-full bg-slate-100 dark:bg-slate-950 flex overflow-hidden font-sans antialiased text-slate-900 dark:text-slate-100">
      <DevPortalSwitcher currentPortal="admin" />
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        session={session}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="admin-main flex-1 flex flex-col h-full min-w-0 min-h-0 overflow-hidden">
        <Navbar 
          activeLabel={getActiveTabLabel()} 
          onToggleSidebar={toggleSidebar}
          isCollapsed={isSidebarCollapsed}
          session={session}
          onLogout={handleLogout}
        />
        <main className={`flex-1 min-h-0 ${activeTab === 'support-chat' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
          <div className={activeTab === 'support-chat' ? "h-full w-full" : "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
