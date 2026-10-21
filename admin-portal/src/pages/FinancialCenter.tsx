import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Search, DollarSign, Briefcase, Check, Info, AlertCircle, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
export default function FinancialCenter() {
  const [activeSubTab, setActiveSubTab] = useState('deposits');
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [settings, setSettings] = useState({
    usdtAddress: 'TY3N9dSk8sHDKsi8s9DKks82kdJS9k1nsD',
    qrCodeUrl: ''
  });
  
  const [session, setSession] = useState({ role: 'Owner', name: 'System Owner', email: 'owner@wallmark.com' });
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Actions states
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(''); // 'view_slip', 'reject_deposit', 'reject_withdrawal'
  const [rejectRemark, setRejectRemark] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editQrCode, setEditQrCode] = useState('');
  const [imageZoom, setImageZoom] = useState(1);

  const fetchFinancialData = async () => {
    try {
      // Session
      const savedSession = localStorage.getItem('cb_admin_session');
      if (savedSession) {
        setSession(JSON.parse(savedSession));
      }

      // Deposits
      const { data: depsData, error: depsError } = await supabase
        .from('cb_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (!depsError && depsData) {
        const mappedDeps = depsData.map(d => ({
          id: d.id,
          userId: d.user_id,
          username: d.username,
          amount: parseFloat(d.amount || 0),
          currency: d.currency,
          screenshotName: d.screenshot_name,
          screenshotUrl: d.screenshot_url,
          status: d.status,
          createdAt: new Date(d.created_at).toLocaleString(),
          referred_by_staff_id: d.referred_by_staff_id || 'None',
          member_of_admin_id: d.member_of_admin_id || 'None'
        }));
        setDeposits(mappedDeps);
      }

      // Withdrawals
      const { data: wthsData, error: wthsError } = await supabase
        .from('cb_withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!wthsError && wthsData) {
        const mappedWths = wthsData.map(w => ({
          id: w.id,
          userId: w.user_id,
          username: w.username,
          amount: parseFloat(w.amount || 0),
          method: w.method,
          account_info: w.account_info,
          status: w.status,
          createdAt: new Date(w.created_at).toLocaleString(),
          referred_by_staff_id: w.referred_by_staff_id || 'None',
          member_of_admin_id: w.member_of_admin_id || 'None',
          remark: w.remark || ''
        }));
        setWithdrawals(mappedWths);
      }

      // Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('cb_deposit_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (!settingsError && settingsData) {
        const currentSettings = {
          usdtAddress: settingsData.usdt_address,
          qrCodeUrl: settingsData.qr_code_url || ''
        };
        setSettings(currentSettings);
        setEditAddress(currentSettings.usdtAddress);
        setEditQrCode(currentSettings.qrCodeUrl);
      }
    } catch (err) {
      console.error("Error loading financial data:", err);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    const interval = setInterval(() => {
      if (document.hidden) return; // Save bandwidth when tab is in background!
      fetchFinancialData();
    }, 15000); // Poll every 15 seconds instead of 3
    return () => clearInterval(interval);
  }, []);

  // Filter listings based on role hierarchy
  const getFilteredDeposits = () => {
    return deposits.filter(d => {
      // 1. Role Filter
      if (session.role === 'Admin') {
        if (d.member_of_admin_id !== (session as any).accountId) return false;
      } else if (session.role === 'Staff') {
        if (d.referred_by_staff_id !== (session as any).accountId) return false;
      }
      
      // 2. Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = d.username.toLowerCase().includes(q) || 
                             d.id.toLowerCase().includes(q) ||
                             d.referred_by_staff_id.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 3. Status filter
      if (statusFilter !== 'All') {
        if (d.status !== statusFilter) return false;
      }

      return true;
    });
  };

  const getFilteredWithdrawals = () => {
    return withdrawals.filter(w => {
      // 1. Role Filter
      if (session.role === 'Admin') {
        if (w.member_of_admin_id !== (session as any).accountId) return false;
      } else if (session.role === 'Staff') {
        if (w.referred_by_staff_id !== (session as any).accountId) return false;
      }
      
      // 2. Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = w.username.toLowerCase().includes(q) || 
                             w.id.toLowerCase().includes(q) ||
                             w.referred_by_staff_id.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 3. Status filter
      if (statusFilter !== 'All') {
        if (w.status !== statusFilter) return false;
      }

      return true;
    });
  };

  const [approvingId, setApprovingId] = useState<string | null>(null);

  /* ─── Actions ─── */
  const handleApproveDeposit = async (dep: any) => {
    if (approvingId) return;
    setApprovingId(dep.id);

    try {
      // 1. Get user to update balance (try user_id first, then fallback to username/phone)
      let targetUser: any = null;

      if (dep.userId) {
        const { data: uData } = await supabase
          .from('cb_users')
          .select('id, balance, username')
          .eq('id', dep.userId);
        if (uData && uData.length > 0) {
          targetUser = uData[0];
        }
      }

      if (!targetUser && dep.username) {
        const cleanName = String(dep.username).trim();
        const noPlus = cleanName.replace(/^[+]/, '');
        const { data: uData } = await supabase
          .from('cb_users')
          .select('id, balance, username')
          .or(`username.eq.${cleanName},phone.eq.${cleanName},username.eq.+${noPlus},phone.eq.+${noPlus}`);
        if (uData && uData.length > 0) {
          targetUser = uData[0];
        }
      }

      // Fallback: search all users if username string format slightly differs
      if (!targetUser && dep.username) {
        const { data: allUsers } = await supabase.from('cb_users').select('id, balance, username, phone');
        if (allUsers) {
          const lowerName = String(dep.username).toLowerCase().trim().replace(/^[+]/, '');
          targetUser = allUsers.find((u: any) => 
            (u.username && u.username.toLowerCase().replace(/^[+]/, '') === lowerName) ||
            (u.phone && u.phone.toLowerCase().replace(/^[+]/, '') === lowerName)
          );
        }
      }

      if (!targetUser) {
        toast.error("User not found for balance update: " + (dep.username || dep.userId));
        setApprovingId(null);
        return;
      }

      const currentBal = Number.parseFloat(String(targetUser.balance ?? '0')) || 0;
      const depositAmt = Number.parseFloat(String(dep.amount ?? '0')) || 0;
      const newBalance = Number((currentBal + depositAmt).toFixed(2));

      // 2. Update user balance in Supabase
      const { error: updateBalanceError } = await supabase
        .from('cb_users')
        .update({ balance: newBalance })
        .eq('id', targetUser.id);

      if (updateBalanceError) {
        toast.error("Error updating user balance: " + updateBalanceError.message);
        setApprovingId(null);
        return;
      }

      // 3. Update deposit status to Approved
      const { error: updateDepError } = await supabase
        .from('cb_deposits')
        .update({ status: 'Approved' })
        .eq('id', dep.id);

      if (updateDepError) {
        toast.error("Error updating deposit status: " + updateDepError.message);
        setApprovingId(null);
        return;
      }

      // Sync local storage if same browser session
      const activeUser = localStorage.getItem('cb_username');
      if (activeUser && (
        activeUser.toLowerCase() === String(dep.username || '').toLowerCase() ||
        activeUser.toLowerCase() === String(targetUser.username || '').toLowerCase()
      )) {
        localStorage.setItem('cb_balance', newBalance.toString());
      }

      toast.success(`Deposit approved! $${depositAmt.toFixed(2)} added to ${targetUser.username || dep.username}.`);
      await fetchFinancialData();
    } catch (err: any) {
      toast.error("Operation failed: " + (err?.message || err));
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenRejectDeposit = (dep: any) => {
    setSelectedItem(dep);
    setActionType('reject_deposit');
    setRejectRemark('');
  };

  const handleConfirmRejectDeposit = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from('cb_deposits')
        .update({ status: 'Rejected' })
        .eq('id', selectedItem.id);

      if (error) {
        toast.error("Error rejecting deposit: " + error.message);
        return;
      }

      setSelectedItem(null);
      setActionType('');
      toast('Deposit request rejected.');
      fetchFinancialData();
    } catch (err: any) {
      toast.error("Failed to reject deposit: " + err.message);
    }
  };

  const handleApproveWithdrawal = async (wth: any) => {
    if (approvingId) return;
    setApprovingId(wth.id);

    try {
      // 1. Get user to update withdrawals
      let targetUser: any = null;

      if (wth.userId) {
        const { data: uData } = await supabase
          .from('cb_users')
          .select('id, withdrawals, username')
          .eq('id', wth.userId);
        if (uData && uData.length > 0) {
          targetUser = uData[0];
        }
      }

      if (!targetUser && wth.username) {
        const cleanName = String(wth.username).trim();
        const noPlus = cleanName.replace(/^[+]/, '');
        const { data: uData } = await supabase
          .from('cb_users')
          .select('id, withdrawals, username')
          .or(`username.eq.${cleanName},phone.eq.${cleanName},username.eq.+${noPlus},phone.eq.+${noPlus}`);
        if (uData && uData.length > 0) {
          targetUser = uData[0];
        }
      }

      if (targetUser) {
        const currentWth = Number.parseFloat(String(targetUser.withdrawals ?? '0')) || 0;
        const newWithdrawals = Number((currentWth + wth.amount).toFixed(2));
        await supabase
          .from('cb_users')
          .update({ withdrawals: newWithdrawals })
          .eq('id', targetUser.id);
      }

      // 2. Update withdrawal status to Approved
      const { error: updateWthError } = await supabase
        .from('cb_withdrawals')
        .update({ status: 'Approved' })
        .eq('id', wth.id);

      if (updateWthError) {
        toast.error("Error updating withdrawal status: " + updateWthError.message);
        setApprovingId(null);
        return;
      }

      toast.success('Withdrawal approved!');
      await fetchFinancialData();
    } catch (err: any) {
      toast.error("Operation failed: " + (err?.message || err));
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenRejectWithdrawal = (wth) => {
    setSelectedItem(wth);
    setActionType('reject_withdrawal');
    setRejectRemark('');
  };

  const handleConfirmRejectWithdrawal = async () => {
    if (!selectedItem) return;

    try {
      // 1. Update status to Rejected
      const { error: updateWthError } = await supabase
        .from('cb_withdrawals')
        .update({ status: 'Rejected' })
        .eq('id', selectedItem.id);

      if (updateWthError) {
        toast.error("Error rejecting withdrawal: " + updateWthError.message);
        return;
      }

      // 2. Refund balance back to user
      const { data: userData, error: userError } = await supabase
        .from('cb_users')
        .select('id, balance')
        .eq('username', selectedItem.username)
        .single();

      if (!userError && userData) {
        const newBalance = parseFloat((parseFloat(userData.balance || 0) + selectedItem.amount).toFixed(2));
        await supabase
          .from('cb_users')
          .update({ balance: newBalance })
          .eq('id', userData.id);

        const activeUser = localStorage.getItem('cb_username');
        if (activeUser && activeUser.toLowerCase() === selectedItem.username.toLowerCase()) {
          localStorage.setItem('cb_balance', newBalance.toString());
        }
      }

      setSelectedItem(null);
      setActionType('');
      toast('Withdrawal request rejected. Funds refunded to user.');
      fetchFinancialData();
    } catch (err) {
      toast.error("Failed to reject withdrawal: " + err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!editAddress) {
      toast('Please provide a valid USDT Address.');
      return;
    }

    try {
      const { error } = await supabase
        .from('cb_deposit_settings')
        .update({ usdt_address: editAddress, qr_code_url: editQrCode })
        .eq('id', 1);

      if (error) {
        toast.error("Error saving settings: " + error.message);
        return;
      }

      setSettings({ usdtAddress: editAddress, qrCodeUrl: editQrCode });
      toast.success('Payment node settings saved successfully!');
      fetchFinancialData();
    } catch (err) {
      toast.error("Failed to save settings: " + err.message);
    }
  };

  const handleViewSlip = (dep) => {
    setSelectedItem(dep);
    setActionType('view_slip');
    setImageZoom(1);
  };

  const filteredDeps = getFilteredDeposits();
  const filteredWths = getFilteredWithdrawals();

  return (
    <div className="w-full space-y-6">
      
      {/* Header and Subtabs */}
      <div className="admin-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-xl tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" />
              Financial Center
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage deposits, approve payouts, and configure payment gateways.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
            <button 
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeSubTab === 'deposits' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              onClick={() => { setActiveSubTab('deposits'); setStatusFilter('All'); setSearchQuery(''); }}
            >
              Deposits ({filteredDeps.filter(d => d.status === 'Pending').length})
            </button>
            <button 
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeSubTab === 'withdrawals' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              onClick={() => { setActiveSubTab('withdrawals'); setStatusFilter('All'); setSearchQuery(''); }}
            >
              Payouts ({filteredWths.filter(w => w.status === 'Pending').length})
            </button>
            <button 
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeSubTab === 'settings' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              onClick={() => { setActiveSubTab('settings'); }}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {activeSubTab !== 'settings' && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search username or request ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:block">Status:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-600 outline-none appearance-none w-full md:w-40"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                backgroundSize: '16px'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      )}

      {activeSubTab === 'deposits' && (
        <div className="admin-card !p-0 overflow-hidden">
          <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
            <table className="admin-table w-full whitespace-nowrap">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Client User</th>
                  <th>Staff Node</th>
                  <th>Amount</th>
                  <th>Network</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                      <th className="text-right sticky right-0 z-20 bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDeps.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                          No deposit requests match current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredDeps.map(dep => (
                        <tr key={dep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td>
                            <span className="font-mono text-xs font-semibold text-slate-500">{dep.id.substring(0,8)}...</span>
                          </td>
                          <td className="font-semibold text-slate-900 dark:text-slate-50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                {dep.username.substring(0,2).toUpperCase()}
                              </div>
                              {dep.username}
                            </div>
                          </td>
                          <td>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs font-semibold">{dep.referred_by_staff_id}</span>
                          </td>
                          <td>
                            <span className="font-mono text-[13px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800/50">
                              ${dep.amount.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800 text-[10px] font-bold tracking-wider">{dep.currency}</span>
                          </td>
                          <td>
                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              dep.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                              dep.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 
                              'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                            }`}>
                              {dep.status}
                            </span>
                          </td>
                          <td className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{dep.createdAt}</td>
                          <td className="text-right whitespace-nowrap space-x-2 sticky right-0 z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
                            <div className="flex justify-end gap-2">
                              <button 
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                onClick={() => handleViewSlip(dep)}
                              >
                                <Eye className="w-3.5 h-3.5" /> Slip
                              </button>
                              {dep.status === 'Pending' && (
                                <>
                                  <button 
                                    disabled={approvingId === dep.id}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 relative z-10"
                                    onClick={() => handleApproveDeposit(dep)}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {approvingId === dep.id ? 'Approving...' : 'Approve'}
                                  </button>
                                  <button 
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 relative z-10"
                                    onClick={() => handleOpenRejectDeposit(dep)}
                                  >
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'withdrawals' && (
            <div className="admin-card !p-0 overflow-hidden">
              <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
                <table className="admin-table w-full whitespace-nowrap">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Client User</th>
                      <th>Staff Node</th>
                      <th>Amount</th>
                      <th>Method & Details</th>
                      <th>Status</th>
                      <th>Submitted Date</th>
                      <th className="text-right sticky right-0 z-20 bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredWths.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                          No payout requests match current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredWths.map(wth => (
                        <tr key={wth.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          <td>
                            <span className="font-mono text-xs font-semibold text-slate-500">{wth.id.substring(0,8)}...</span>
                          </td>
                          <td className="font-semibold text-slate-900 dark:text-slate-50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                {wth.username.substring(0,2).toUpperCase()}
                              </div>
                              {wth.username}
                            </div>
                          </td>
                          <td>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs font-semibold">{wth.referred_by_staff_id}</span>
                          </td>
                          <td>
                            <span className="font-mono text-[13px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-800/50">
                              ${wth.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="space-y-1">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{wth.method}</div>
                            <div className="font-mono text-[10px] text-slate-500 break-all max-w-[200px] whitespace-normal">{wth.account_info}</div>
                          </td>
                          <td>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                wth.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                                wth.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 
                                'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              }`}>
                                {wth.status}
                              </span>
                              {wth.remark && (
                                <span className="text-[9px] text-slate-400 max-w-[120px] text-center leading-tight whitespace-normal">
                                  * {wth.remark}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{wth.createdAt}</td>
                          <td className="text-right whitespace-nowrap space-x-2 sticky right-0 z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
                            <div className="flex justify-end gap-2">
                              {wth.status === 'Pending' ? (
                                <>
                                  <button 
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 relative z-10"
                                    onClick={() => handleApproveWithdrawal(wth)}
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button 
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 relative z-10"
                                    onClick={() => handleOpenRejectWithdrawal(wth)}
                                  >
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                  Locked
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'settings' && (
            <div className="admin-card max-w-2xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 text-lg">Payment Node Gateway Settings</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure system-wide payment receiving details</p>
                </div>
              </div>
              
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">USDT Wallet Receive Address (TRC20)</label>
                  <input 
                    type="text" 
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    disabled={session.role === 'Staff'}
                    required
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all disabled:opacity-60"
                    placeholder="e.g. TY3N9dSk8sHDKsi8s..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">QR Code Image URL (Optional)</label>
                  <input 
                    type="text" 
                    value={editQrCode}
                    onChange={(e) => setEditQrCode(e.target.value)}
                    disabled={session.role === 'Staff'}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all disabled:opacity-60"
                    placeholder="e.g. https://domain.com/receipt-qr.png"
                  />
                </div>

                {session.role !== 'Staff' ? (
                  <button 
                    type="submit" 
                    className="w-full sm:w-auto mt-4 px-6 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Check className="w-4 h-4" />
                    Save Payment Configuration
                  </button>
                ) : (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-slate-500 dark:text-slate-400 text-sm">
                    <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <p>Staff nodes are not authorized to modify payment gateway settings. Please contact the main administrator.</p>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Slide-over sheet overlays */}
          {actionType === 'view_slip' && selectedItem && (
            <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
              <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 overflow-y-auto">
                <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/20 shadow-xs">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">Receipt Slip Details</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reference ID: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">#{selectedItem.id.substring(0,8)}</span></p>
                    </div>
                  </div>
                  <button 
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                    onClick={() => { setSelectedItem(null); setActionType(''); }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 bg-slate-50/50 dark:bg-slate-950/30 flex-1 flex flex-col items-center gap-5 overflow-y-auto">
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Uploaded Slip File:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[280px]" title={selectedItem.screenshotName}>
                      {selectedItem.screenshotName || 'receipt_slip.png'}
                    </span>
                  </div>
                  
                  <div className="w-full relative min-h-[360px] max-h-[500px] overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-inner">
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 10%, transparent 11%)', backgroundSize: '16px 16px' }} />
                    
                    <img 
                      src={selectedItem.screenshotUrl} 
                      alt="Receipt Slip" 
                      style={{ 
                        transform: `scale(${imageZoom})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="max-h-full max-w-full rounded-lg object-contain shadow-lg transition-transform z-10"
                    />
                  </div>
                  
                  <div className="w-full flex items-center justify-between gap-4 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Search className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Zoom Control</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="0.1" 
                        value={imageZoom} 
                        onChange={(e) => setImageZoom(parseFloat(e.target.value))} 
                        className="w-32 sm:w-44 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono w-10 text-right">{imageZoom.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end sticky bottom-0 z-10">
                  <button 
                    className="px-6 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
                    onClick={() => { setSelectedItem(null); setActionType(''); }}
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {(actionType === 'reject_deposit' || actionType === 'reject_withdrawal') && selectedItem && (
            <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
              <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 overflow-y-auto">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    Reject {actionType === 'reject_deposit' ? 'Deposit' : 'Withdrawal'} Request
                  </h3>
                  <button 
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                    onClick={() => { setSelectedItem(null); setActionType(''); }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 text-sm">
                      <p className="font-semibold mb-1">Confirm Request Rejection</p>
                      <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                        You are about to reject the {actionType === 'reject_deposit' ? 'deposit' : 'payout'} request of <b className="font-mono text-rose-600 dark:text-rose-400">${selectedItem.amount.toFixed(2)}</b> submitted by user <b className="font-bold">{selectedItem.username}</b>.
                      </p>
                      {actionType === 'reject_withdrawal' && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
                          * Rejecting this withdrawal will automatically refund ${selectedItem.amount.toFixed(2)} back to the client's balance.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rejection Remark / Reason</label>
                      <textarea 
                        className="w-full h-32 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none shadow-xs"
                        placeholder="e.g. Invalid receipt slip, unverified transaction reference, or incorrect network details..."
                        value={rejectRemark}
                        onChange={(e) => setRejectRemark(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                    <button 
                      type="button"
                      className="px-5 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                      onClick={() => { setSelectedItem(null); setActionType(''); }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      className="px-6 h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center gap-2"
                      onClick={actionType === 'reject_deposit' ? handleConfirmRejectDeposit : handleConfirmRejectWithdrawal}
                    >
                      <X className="w-4 h-4" />
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

    </div>
  );
}
