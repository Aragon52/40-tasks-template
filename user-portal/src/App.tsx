import React, { Component, useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Orders from './pages/Orders';
import ShopOrder from './pages/ShopOrder';
import Support from './pages/Support';
import Profile from './pages/Profile';
import Security from './pages/Security';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import TransactionLogs from './pages/TransactionLogs';
import Affiliate from './pages/Affiliate';
import Login from './pages/Login';
import Register from './pages/Register';
import { supabase } from './supabase';
import { Toaster } from 'react-hot-toast';
import { LoadingProvider } from './components/GlobalLoader';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import MaintenanceBreak from './components/MaintenanceBreak';
import { getInitialMaintenanceState } from './config/maintenanceConfig';
import DevPortalSwitcher from './components/DevPortalSwitcher';


interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("User portal rendering error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-900 text-center font-sans">
          <h2 className="text-2xl font-black mb-3">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-8 max-w-md leading-relaxed">
            We encountered an unexpected error loading the portal. Click below to reload.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-8 py-3.5 rounded-2xl bg-[#0071ce] hover:bg-[#005fa7] text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Route guards
function ProtectedRoute({ children }) {
  let session = null;
  try {
    session = localStorage.getItem('cb_user_session');
  } catch (e) {
    console.warn("Storage error", e);
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  let session = null;
  try {
    session = localStorage.getItem('cb_user_session');
  } catch (e) {
    console.warn("Storage error", e);
  }
  if (session) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  // Maintenance window state
  const [isMaintenance, setIsMaintenance] = useState(() => {
    try {
      const search = window.location.search || window.location.hash || '';
      if (search.includes('bypass=true') || search.includes('bypass_maintenance=true')) {
        return false;
      }
      if (localStorage.getItem('cb_maintenance_bypassed') === 'true') {
        return false;
      }
      return getInitialMaintenanceState();
    } catch {
      return false;
    }
  });

  const [isBypassed, setIsBypassed] = useState(() => {
    try {
      return localStorage.getItem('cb_maintenance_bypassed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleMaintenanceUpdate = (e) => {
      if (e?.detail?.active !== undefined) {
        setIsMaintenance(e.detail.active);
      } else {
        setIsMaintenance(getInitialMaintenanceState());
      }
    };

    window.addEventListener('cb_maintenance_updated', handleMaintenanceUpdate);
    window.addEventListener('storage', handleMaintenanceUpdate);

    const channel = supabase.channel('system_maintenance')
      .on('broadcast', { event: 'maintenance_toggle' }, (payload) => {
        if (payload?.payload?.active !== undefined) {
          setIsMaintenance(payload.payload.active);
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('cb_maintenance_updated', handleMaintenanceUpdate);
      window.removeEventListener('storage', handleMaintenanceUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  // Theme state: 'orange' or 'red'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('cb_theme') || 'orange';
    } catch {
      return 'orange';
    }
  });

  // Balance state
  const [balance, setBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('cb_balance');
      const val = saved ? parseFloat(saved) : 0;
      return isNaN(val) ? 0 : val;
    } catch {
      return 0;
    }
  });

  // Username
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem('cb_username') || '';
    } catch {
      return '';
    }
  });

  // Orders list
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('cb_orders');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Helper to re-hydrate state from localStorage
  const refreshSessionFromStorage = () => {
    try {
      const savedUser = localStorage.getItem('cb_username') || '';
      const savedBal = localStorage.getItem('cb_balance');
      const parsedBal = savedBal ? parseFloat(savedBal) : 0;
      const savedOrders = localStorage.getItem('cb_orders');
      let parsedOrders = [];
      if (savedOrders) {
        const p = JSON.parse(savedOrders);
        if (Array.isArray(p)) parsedOrders = p;
      }

      setUsername(savedUser);
      setBalance(isNaN(parsedBal) ? 0 : parsedBal);
      setOrders(parsedOrders);
    } catch (e) {
      console.warn("Storage refresh error:", e);
    }
  };

  // Listen for login/logout/register storage updates dynamically
  useEffect(() => {
    const handleSessionChange = () => {
      refreshSessionFromStorage();
    };

    window.addEventListener('storage', handleSessionChange);
    window.addEventListener('cb_session_updated', handleSessionChange);
    window.addEventListener('hashchange', handleSessionChange);

    // Initial check
    refreshSessionFromStorage();

    return () => {
      window.removeEventListener('storage', handleSessionChange);
      window.removeEventListener('cb_session_updated', handleSessionChange);
      window.removeEventListener('hashchange', handleSessionChange);
    };
  }, []);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme === 'red' ? 'theme-red' : '';
    localStorage.setItem('cb_theme', theme);
  }, [theme]);

  // Capture PWA install prompt globally
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Sync active non-empty state changes back to localStorage
  useEffect(() => {
    if (balance !== 0 || localStorage.getItem('cb_balance') !== null) {
      localStorage.setItem('cb_balance', balance.toString());
    }
  }, [balance]);

  useEffect(() => {
    if (username) {
      localStorage.setItem('cb_username', username);
    }
  }, [username]);

  useEffect(() => {
    if (orders && orders.length > 0) {
      localStorage.setItem('cb_orders', JSON.stringify(orders));
    }
  }, [orders]);

  // Triggered when theme updates
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  const updateBalance = (amount) => {
    const currentVal = isNaN(balanceRef.current) ? 0 : balanceRef.current;
    const nextBalance = parseFloat((currentVal + amount).toFixed(2));
    
    balanceRef.current = nextBalance;
    setBalance(nextBalance);

    try {
      localStorage.setItem('cb_balance', nextBalance.toString());
    } catch (e) {}

    // Get target user session metadata
    let targetId = null;
    let targetUsername = username || localStorage.getItem('cb_username') || '';
    try {
      const sessionStr = localStorage.getItem('cb_user_session');
      if (sessionStr) {
        const s = JSON.parse(sessionStr);
        if (s?.id) targetId = s.id;
        if (s?.username) targetUsername = s.username;
      }
    } catch (e) {}

    const applyUserFilter = (queryBuilder) => {
      if (targetId) {
        return queryBuilder.eq('id', targetId);
      }
      if (targetUsername) {
        const raw = targetUsername.trim();
        const clean = raw.replace(/^[+]/, '');
        return queryBuilder.or(`username.eq.${raw},phone.eq.${raw},username.eq.+${clean},phone.eq.+${clean}`);
      }
      return queryBuilder;
    };

    // Persist balance in Supabase cb_users table
    applyUserFilter(supabase.from('cb_users').update({ balance: nextBalance }))
      .then(({ error }) => {
        if (error) console.error("Database balance update error:", error.message);
      })
      .catch(err => console.error("Database connection error on balance update:", err));

    // If positive commission earnings, update cumulative earnings in Supabase
    if (amount > 0 && (targetId || targetUsername)) {
      applyUserFilter(supabase.from('cb_users').select('earnings'))
        .then(({ data }) => {
          const userRow = Array.isArray(data) ? data[0] : data;
          const currentEarnings = parseFloat(userRow?.earnings || 0);
          const nextEarnings = parseFloat((currentEarnings + amount).toFixed(4));
          applyUserFilter(supabase.from('cb_users').update({ earnings: nextEarnings }))
            .then(() => {})
            .catch(() => {});
        })
        .catch(() => {});
    }

    return nextBalance;
  };

  const addPendingDeposit = () => {};
  const addPendingWithdraw = () => {};

  // Set user online status on session restore, visibility change, and page unload
  useEffect(() => {
    if (!username) return;

    const setOnlineStatus = async (status: string) => {
      try {
        const { error } = await supabase.from('cb_users').update({ online: status }).eq('username', username);
        if (error) {
          const errMsg = error?.message || JSON.stringify(error);
          if (errMsg.includes('Failed to fetch') || errMsg.includes('TypeError')) {
            console.warn("Offline or transient network warning setting online status:", errMsg);
          } else {
            console.error("Error setting online status:", errMsg);
          }
        }
      } catch (err: any) {
        console.warn("Failed to set online status due to network error:", err?.message || err);
      }
    };

    const handleVisibilityChange = () => {
      const status = document.visibilityState === 'visible' ? 'Online' : 'Offline';
      setOnlineStatus(status);
    };

    const handleUnload = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const url = `${supabaseUrl}/rest/v1/cb_users?username=eq.${encodeURIComponent(username)}`;
        fetch(url, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ online: 'Offline' }),
          keepalive: true
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    // Initial set to Online when component mounts
    setOnlineStatus('Online');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
      // Try to set Offline when unmounting
      handleUnload();
    };
  }, [username]);

  // Periodically sync user profile and orders from Supabase database
  useEffect(() => {
    const activeUser = username || localStorage.getItem('cb_username') || '';
    if (!activeUser) return;

    const syncWithDatabase = async () => {
      if (document.hidden) return; // Save bandwidth when tab is in background!
      try {
        let targetId = null;
        try {
          const sessionStr = localStorage.getItem('cb_user_session');
          if (sessionStr) {
            const s = JSON.parse(sessionStr);
            if (s?.id) targetId = s.id;
          }
        } catch (e) {}

        // 1. Fetch user balance accurately using ID or multi-field username/phone match
        let userQuery = supabase.from('cb_users').select('balance, id');
        if (targetId) {
          userQuery = userQuery.eq('id', targetId);
        } else {
          const raw = activeUser.trim();
          const clean = raw.replace(/^[+]/, '');
          userQuery = userQuery.or(`username.eq.${raw},phone.eq.${raw},username.eq.+${clean},phone.eq.+${clean}`);
        }

        const { data: usersData, error: userError } = await userQuery;
        const users = usersData as any[];

        if (!userError && users && users.length > 0) {
          const fetchedBalance = parseFloat(users[0].balance);
          if (!isNaN(fetchedBalance)) {
            if (Math.abs(balanceRef.current - fetchedBalance) >= 0.001) {
              balanceRef.current = fetchedBalance;
              setBalance(fetchedBalance);
              try {
                localStorage.setItem('cb_balance', fetchedBalance.toString());
              } catch (e) {}
            }
          }
        }

        // 2. Fetch matched orders list from cb_orders and cb_assigned_tasks
        const rawUser = activeUser.trim();
        const cleanUser = rawUser.replace(/^[+]/, '');
        const { data: ordersData, error: ordersError } = await supabase
          .from('cb_orders')
          .select('*')
          .or(`username.eq.${rawUser},phone.eq.${rawUser},username.eq.+${cleanUser},phone.eq.+${cleanUser}`)
          .order('id', { ascending: false });

        let combinedOrders: any[] = [];
        if (!ordersError && ordersData) {
          combinedOrders = ordersData.map(o => ({
            id: o.id,
            timestamp: o.timestamp ? new Date(o.timestamp).toLocaleString() : new Date().toLocaleString(),
            status: o.status || 'Pending',
            title: o.title || 'Matched Product Order',
            image: o.image || null,
            price: (o.price || 0).toString(),
            profit: (o.profit || 0).toString(),
            type: o.type,
            assignedTaskId: o.assigned_task_id,
            assignedOrderIndex: o.assigned_order_index
          }));
        }

        // Also fetch active/completed tasks from cb_assigned_tasks to ensure task orders are never missing
        try {
          const { data: taskData } = await supabase
            .from('cb_assigned_tasks')
            .select('*')
            .ilike('username', rawUser);

          if (taskData && taskData.length > 0) {
            taskData.forEach(task => {
              const taskOrders = Array.isArray(task.orders)
                ? task.orders
                : (typeof task.orders === 'string' ? JSON.parse(task.orders) : []);

              taskOrders.forEach((to: any, idx: number) => {
                const orderId = to.id || `task-${task.id}-${idx}`;
                const exists = combinedOrders.some(co => String(co.id) === String(orderId));
                if (!exists) {
                  combinedOrders.push({
                    id: orderId,
                    timestamp: to.timestamp ? new Date(to.timestamp).toLocaleString() : new Date(task.created_at || Date.now()).toLocaleString(),
                    status: to.status || 'Pending',
                    title: to.title || `Matched Order #${idx + 1}`,
                    image: to.image || null,
                    price: (to.price || 0).toString(),
                    profit: (to.profit || 0).toString(),
                    type: to.type || 'gear',
                    assignedTaskId: task.id,
                    assignedOrderIndex: idx
                  });
                }
              });
            });
          }
        } catch (e) {
          console.warn("Error merging assigned task orders:", e);
        }

        if (combinedOrders.length > 0) {
          setOrders(prevOrders => {
            if (prevOrders.length === combinedOrders.length) {
              const isIdentical = prevOrders.every((po, idx) => {
                const fo = combinedOrders[idx];
                return fo && po.id === fo.id && po.status === fo.status && po.price === fo.price && po.profit === fo.profit;
              });
              if (isIdentical) return prevOrders;
            }
            return combinedOrders;
          });
        }
      } catch (err) {
        console.error("Database sync error:", err);
      }
    };

    // Realtime channel listener for instant database updates without waiting
    const channel = supabase
      .channel(`rt:${username}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_users', filter: `username=eq.${username}` }, (payload: any) => {
        if (payload.new && typeof payload.new.balance !== 'undefined') {
          const newBal = parseFloat(payload.new.balance);
          setBalance(prev => (Math.abs(prev - newBal) < 0.001 ? prev : newBal));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_orders', filter: `username=eq.${username}` }, () => {
        syncWithDatabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_assigned_tasks', filter: `username=eq.${username}` }, () => {
        syncWithDatabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_deposits', filter: `username=eq.${username}` }, () => {
        syncWithDatabase();
      })
      .subscribe();

    syncWithDatabase();
    const interval = setInterval(() => {
      if (document.hidden) return;
      syncWithDatabase();
    }, 15000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [username]);

  if (isMaintenance && !isBypassed) {
    return (
      <MaintenanceBreak 
        onBypass={() => {
          setIsBypassed(true);
          try {
            localStorage.setItem('cb_maintenance_bypassed', 'true');
          } catch (e) {}
        }} 
      />
    );
  }

  return (
    <LoadingProvider>
      <DevPortalSwitcher currentPortal="user" />
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-slate-200/60 dark:bg-slate-950 flex justify-center items-start w-full sm:py-6">
                  <div className="w-full max-w-md min-h-screen sm:min-h-[calc(100vh-3rem)] bg-slate-50 dark:bg-slate-900 shadow-2xl sm:rounded-2xl relative flex flex-col overflow-x-hidden border border-slate-200/60 dark:border-slate-800/80">
                    {/* Show brand Header on all pages */}
                    <ConditionalHeader theme={theme} onThemeChange={handleThemeChange} />
                    
                    <div className="flex-1 px-3.5 pt-2 pb-16 space-y-3.5 overflow-y-auto">
                    <Routes>
                      <Route path="" element={<Navigate to="/home" replace />} />
                      <Route 
                        path="home" 
                        element={<Home currentTheme={theme} balance={balance} username={username} orders={orders} />} 
                      />
                      <Route 
                        path="orders" 
                        element={
                          <Orders 
                            balance={balance}
                            orders={orders} 
                            setOrders={setOrders} 
                            updateBalance={updateBalance} 
                          />
                        } 
                      />
                      <Route 
                        path="match" 
                        element={
                          <ShopOrder 
                            balance={balance} 
                            updateBalance={updateBalance} 
                            orders={orders} 
                            setOrders={setOrders} 
                          />
                        } 
                      />
                      <Route path="support" element={<Support />} />
                      <Route 
                        path="profile" 
                        element={
                          <Profile 
                            balance={balance} 
                            username={username}
                            setUsername={setUsername}
                            setBalance={setBalance}
                            setOrders={setOrders}
                          />
                        } 
                      />
                      <Route 
                        path="security" 
                        element={<Security />} 
                      />
                      <Route 
                        path="affiliate" 
                        element={<Affiliate />} 
                      />
                      <Route 
                        path="deposit" 
                        element={<Deposit addPendingDeposit={addPendingDeposit} />} 
                      />
                      <Route 
                        path="withdraw" 
                        element={
                          <Withdraw 
                            balance={balance} 
                            updateBalance={updateBalance} 
                            addPendingWithdraw={addPendingWithdraw} 
                          />
                        } 
                      />
                      <Route path="deposit-history" element={<TransactionLogs username={username} />} />
                      <Route path="payout-history" element={<TransactionLogs username={username} />} />
                      <Route path="transaction-logs" element={<TransactionLogs username={username} />} />
                      <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                  </div>

                  {/* Show Bottom Nav bar on main navigation routes */}
                  <ConditionalBottomNav />

                  {/* PWA custom prompt installer */}
                  <PWAInstallPrompt />
                </div>
              </div>
            </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </LoadingProvider>
  );
}

// Subcomponents to handle conditional headers and footers based on route
function ConditionalHeader({ theme, onThemeChange }: { theme: string; onThemeChange: (t: string) => void }) {
  return <Header currentTheme={theme} onThemeChange={onThemeChange} />;
}

function ConditionalBottomNav() {
  const path = window.location.hash;
  const hideNav = path.includes('/deposit') || path.includes('/withdraw');
  if (hideNav) return null;
  return <BottomNav />;
}
