import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { 
  Search, 
  User, 
  UserCheck, 
  UserX, 
  Coins, 
  DollarSign, 
  Smartphone, 
  Mail, 
  Layers, 
  Lock, 
  Shield, 
  Trash2, 
  Edit3, 
  Activity, 
  Filter, 
  Calendar, 
  X, 
  FileText, 
  CheckCircle, 
  Ban, 
  Award, 
  ArrowUpRight, 
  Globe,
  Database,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  History,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Button, Modal, Card, Input, Badge } from '../shared/UI';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnline, setFilterOnline] = useState('All');

  // Edit modal
  const [editUser, setEditUser] = useState<any>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Reset passwords modal
  const [resetPWUser, setResetPWUser] = useState<any>(null);
  const [resetPWFields, setResetPWFields] = useState({
    loginPassword: '',
    withdrawPassword: ''
  });
  const [resettingPW, setResettingPW] = useState(false);

  // View details modal
  const [viewUser, setViewUser] = useState<any>(null);

  // Compute dynamic stats for the top cards
  const stats = React.useMemo(() => {
    const total = users.length;
    const online = users.filter(u => u.online === 'Online').length;
    const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
    const totalFrozen = users.reduce((acc, u) => acc + (u.frozen || 0), 0);
    return { total, online, totalBalance, totalFrozen };
  }, [users]);

  const getTemplateName = (task: any) => {
    if (!task) return 'Custom';
    const amt = parseFloat(task.total_amount || 0);
    const count = parseInt(task.order_count || 0);
    
    if (count === 40) {
      if (Math.abs(amt - 30718.07) < 100) return 'Order Template M-1';
      if (Math.abs(amt - 98290.93) < 100) return 'Order Template M-2';
      if (Math.abs(amt - 353999.72) < 500) return 'Order Template M-3';
      if (Math.abs(amt - 508022.10) < 500) return 'Order Template M-4';
      if (Math.abs(amt - 817.17) < 10) return 'Order Template C-1';
      if (Math.abs(amt - 3920.24) < 50) return 'Order Template C-2';
      if (Math.abs(amt - 104951.13) < 500) return 'Order Template C-3';
      if (Math.abs(amt - 75852.5) < 500) return 'Order Template C-4';
      if (Math.abs(amt - 148524.49) < 500) return 'Order Template C-5';
    }
    
    let ordersList = [];
    try {
      ordersList = typeof task.orders === 'string' ? JSON.parse(task.orders) : (task.orders || []);
    } catch (e) {
      ordersList = task.orders || [];
    }
    
    const firstTitle = ordersList[0]?.title || '';
    const sumPrices = ordersList.reduce((acc: number, o: any) => acc + parseFloat(o.price || 0), 0);
    if (Math.abs(sumPrices - 30718.07) < 100) return 'Order Template M-1';
    if (Math.abs(sumPrices - 98290.93) < 100) return 'Order Template M-2';
    if (Math.abs(sumPrices - 353999.72) < 500) return 'Order Template M-3';
    if (Math.abs(sumPrices - 508022.10) < 500) return 'Order Template M-4';
    if (Math.abs(sumPrices - 817.17) < 10) return 'Order Template C-1';
    if (Math.abs(sumPrices - 3920.24) < 50) return 'Order Template C-2';
    if (Math.abs(sumPrices - 104951.13) < 500) return 'Order Template C-3';
    if (Math.abs(sumPrices - 75852.5) < 500) return 'Order Template C-4';
    if (Math.abs(sumPrices - 148524.49) < 500) return 'Order Template C-5';
    
    if (firstTitle.includes("Saint Laurent") || firstTitle.includes("RÉNERGIE LIFT")) {
      if (Math.abs(sumPrices - 30718.07) < 1000) return 'Order Template M-1';
      if (Math.abs(sumPrices - 98290.93) < 1000) return 'Order Template M-2';
      if (Math.abs(sumPrices - 353999.72) < 5000) return 'Order Template M-3';
      if (Math.abs(sumPrices - 508022.10) < 5000) return 'Order Template M-4';
      if (Math.abs(sumPrices - 817.17) < 50) return 'Order Template C-1';
      if (Math.abs(sumPrices - 3920.24) < 100) return 'Order Template C-2';
    }
    if (firstTitle.includes("Ergonomic Memory")) return 'Order Template C-2';
    if (firstTitle.includes("Premium Gel Ink")) return 'Order Template C-1';
    if (firstTitle.includes("Premium Noise-Cancelling") || firstTitle.includes("GrandPad Senior")) {
      if (Math.abs(sumPrices - 104951.13) < 5000) return 'Order Template C-3';
    }
    if (firstTitle.includes("Ted Baker") || firstTitle.includes("Powder Canister")) {
      if (Math.abs(sumPrices - 75852.5) < 5000) return 'Order Template C-4';
      if (Math.abs(sumPrices - 148524.49) < 5000) return 'Order Template C-5';
    }
    
    return `Custom Task (${count} items)`;
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('cb_users')
        .select('*')
        .order('reg_time', { ascending: false });

      if (!error && data) {
        // Fetch assigned tasks to check completed/ongoing templates
        const { data: tasksData } = await supabase
          .from('cb_assigned_tasks')
          .select('*');

        const userTasks = tasksData || [];

        const session = JSON.parse(localStorage.getItem('cb_admin_session') || '{}');
        let mapped = data.map(u => {
          const referer = data.find(r => r.id === u.invited_by_user_id);
          
          const uTasks = userTasks.filter(t => t.username?.toLowerCase() === u.username?.toLowerCase());
          
          const completedTemplates = uTasks
            .filter(t => t.status === 'Completed')
            .map(t => getTemplateName(t));
            
          const ongoingTemplates = uTasks
            .filter(t => t.status === 'Pending' || t.status === 'In Progress')
            .map(t => getTemplateName(t));

          return {
            id: u.id,
            username: u.username,
            email: u.email,
            phone: u.phone,
            password_plain: u.password_plain || '',
            password: u.password || '',
            withdraw_password: u.withdraw_password || '',
            nickname: u.nickname || '',
            level: u.level || 1,
            online: u.online || 'Offline',
            balance: parseFloat(u.balance || 0),
            frozen: parseFloat(u.frozen || 0),
            earnings: parseFloat(u.earnings || 0),
            commissions: parseFloat(u.commissions || 0),
            withdrawals: parseFloat(u.withdrawals || 0),
            topup: parseFloat(u.topup || 0),
            usdt_address: u.usdt_address || '',
            bank_name: u.bank_name || '',
            bank_account: u.bank_account || '',
            bank_holder: u.bank_holder || '',
            withdraw: (u.withdraw === 'Enable' || u.withdraw === 'Enabled') ? 'Enabled' : 'Disabled',
            inviteCode: u.invite_code || '',
            inviter: u.inviter || '',
            referred_by_staff_id: u.referred_by_staff_id || '',
            member_of_admin_id: u.member_of_admin_id || '',
            ip: u.ip || '',
            regTime: new Date(u.reg_time).toLocaleDateString(),
            invited_by_user_id: u.invited_by_user_id || '',
            referred_by_username: referer ? referer.username : '',
            completedTemplates,
            ongoingTemplates,
          };
        });

        const s = session as any;
        if (s?.role === 'Admin') {
          mapped = mapped.filter(u => u.member_of_admin_id === s?.accountId);
        } else if (s?.role === 'Staff') {
          mapped = mapped.filter(u => u.referred_by_staff_id === s?.accountId);
        }

        setUsers(mapped);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
      if (document.hidden) return; 
      fetchUsers();
    }, 15000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = [...users];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.inviteCode && u.inviteCode.toLowerCase().includes(q)) ||
        (u.referred_by_staff_id && u.referred_by_staff_id.toLowerCase().includes(q)) ||
        (u.member_of_admin_id && u.member_of_admin_id.toLowerCase().includes(q))
      );
    }
    if (filterOnline !== 'All') {
      result = result.filter(u => u.online === filterOnline);
    }
    setFilteredUsers(result);
  }, [users, searchQuery, filterOnline]);

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditFields({
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      password_plain: user.password_plain || '',
      password: user.password || '',
      withdraw_password: user.withdraw_password || '',
      balance: (user.balance ?? 0).toString(),
      frozen: (user.frozen ?? 0).toString(),
      usdt_address: user.usdt_address || '',
      bank_name: user.bank_name || '',
      bank_account: user.bank_account || '',
      bank_holder: user.bank_holder || '',
      withdraw: (user.withdraw === 'Enable' || user.withdraw === 'Enabled') ? 'Enabled' : 'Disabled',
      level: (user.level ?? 1).toString(),
      invited_by_user_id: user.invited_by_user_id || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      let finalInvitedByUserId = null;
      if (editFields.invited_by_user_id) {
        const trimmed = (editFields.invited_by_user_id || '').trim();
        if (trimmed) {
          const foundById = users.find(u => u.id === trimmed);
          if (foundById) {
            finalInvitedByUserId = trimmed;
          } else {
            const foundByName = users.find(u => u.username.toLowerCase() === trimmed.toLowerCase() || (u.nickname && u.nickname.toLowerCase() === trimmed.toLowerCase()));
            if (foundByName) {
              finalInvitedByUserId = foundByName.id;
            } else {
              finalInvitedByUserId = trimmed;
            }
          }
        }
      }

      const updates = {
        username: (editFields.username || '').trim(),
        email: (editFields.email || '').trim(),
        phone: (editFields.phone || '').trim(),
        password_plain: (editFields.password_plain || '').trim(),
        password: (editFields.password || '').trim() || (editFields.password_plain || '').trim(),
        withdraw_password: (editFields.withdraw_password || '').trim(),
        balance: parseFloat(editFields.balance) || 0,
        frozen: parseFloat(editFields.frozen) || 0,
        usdt_address: (editFields.usdt_address || '').trim(),
        bank_name: (editFields.bank_name || '').trim(),
        bank_account: (editFields.bank_account || '').trim(),
        bank_holder: (editFields.bank_holder || '').trim(),
        withdraw: (editFields.withdraw === 'Enable' || editFields.withdraw === 'Enabled') ? 'Enabled' : 'Disabled',
        level: parseInt(editFields.level) || 1,
        invited_by_user_id: finalInvitedByUserId,
      };

      const { error } = await supabase
        .from('cb_users')
        .update(updates)
        .eq('id', editUser.id);

      if (error) {
        toast.error('Error saving: ' + error.message);
        return;
      }
      toast.success(`User ${editUser.username} updated successfully!`);
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openResetPasswords = (user: any) => {
    setResetPWUser(user);
    setResetPWFields({
      loginPassword: user.password_plain || user.password || '',
      withdrawPassword: user.withdraw_password || ''
    });
  };

  const handleSaveResetPW = async () => {
    if (!resetPWUser) return;
    setResettingPW(true);
    try {
      const updates = {
        password: resetPWFields.loginPassword.trim(),
        password_plain: resetPWFields.loginPassword.trim(),
        withdraw_password: resetPWFields.withdrawPassword.trim()
      };

      if (!updates.password) {
        toast.error('Login password cannot be empty');
        setResettingPW(false);
        return;
      }

      const { error } = await supabase
        .from('cb_users')
        .update(updates)
        .eq('id', resetPWUser.id);

      if (error) {
        toast.error('Error resetting passwords: ' + error.message);
        return;
      }
      toast.success(`Security credentials for ${resetPWUser.username} updated successfully!`);
      setResetPWUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error('Reset failed: ' + err.message);
    } finally {
      setResettingPW(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await supabase.from('cb_orders').delete().eq('username', user.username);
      await supabase.from('cb_assigned_tasks').delete().eq('username', user.username);
      await supabase.from('cb_deposits').delete().eq('username', user.username);
      await supabase.from('cb_withdrawals').delete().eq('username', user.username);

      const { error } = await supabase.from('cb_users').delete().eq('id', user.id);
      if (error) {
        toast.error('Error deleting user: ' + error.message);
        return;
      }
      toast.success(`User ${user.username} and all related data deleted.`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleToggleWithdraw = async (user: any) => {
    const isCurrentlyEnabled = user.withdraw === 'Enable' || user.withdraw === 'Enabled';
    const newVal = isCurrentlyEnabled ? 'Disabled' : 'Enabled';
    const { error } = await supabase.from('cb_users').update({ withdraw: newVal }).eq('id', user.id);
    if (error) {
      toast.error('Action failed: ' + error.message);
    } else {
      toast.success(`Withdrawal ${newVal === 'Enabled' ? 'Enabled' : 'Disabled'} for ${user.username}.`);
      fetchUsers();
    }
  };

  const getAvatarColorClass = (username: string) => {
    const colors = [
      'bg-indigo-500 text-indigo-50 border-indigo-200',
      'bg-purple-500 text-purple-50 border-purple-200',
      'bg-sky-500 text-sky-50 border-sky-200',
      'bg-pink-500 text-pink-50 border-pink-200',
      'bg-emerald-500 text-emerald-50 border-emerald-200',
      'bg-rose-500 text-rose-50 border-rose-200',
    ];
    let sum = 0;
    for (let i = 0; i < username.length; i++) sum += username.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top statistics panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Registered Users',
            value: stats.total,
            sub: 'Operational Accounts',
            icon: User,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10'
          },
          {
            title: 'Users Online Now',
            value: stats.online,
            sub: 'Active Live Sessions',
            icon: Activity,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            pulse: true
          },
          {
            title: 'Aggregate Balances',
            value: `$${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: 'Available Net Capital',
            icon: DollarSign,
            color: 'text-sky-600 dark:text-sky-400',
            bg: 'bg-sky-500/10'
          },
          {
            title: 'Frozen Securities',
            value: `$${stats.totalFrozen.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sub: 'Locked Order Escrows',
            icon: Lock,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10'
          }
        ].map((item, idx) => (
          <Card key={idx} className="p-5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-125 transition-transform duration-500`} />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.title}</span>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{item.value}</h3>
                  {item.pulse && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-500">{item.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main dashboard list container */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">User Management Console</h3>
              <p className="text-xs text-slate-500 font-medium">
                Monitor user balances, adjust account levels, and manage payout restrictions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest py-1 px-3">
                {filteredUsers.length} Match{filteredUsers.length !== 1 ? 'es' : ''}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search user ID, username, email, phone number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-50 text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={filterOnline}
                onChange={e => setFilterOnline(e.target.value)}
                className="w-full pl-9 pr-8 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-50 text-xs font-bold uppercase tracking-wider outline-none appearance-none transition-all focus:ring-2 focus:ring-indigo-600"
              >
                <option value="All">All Status Levels</option>
                <option value="Online">Live (Online)</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Profile</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referral Bond</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Assets</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout Config</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Stats</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Templates</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <UserX className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">No operational users found</div>
                      <p className="text-xs text-slate-500 max-w-xs">Try adjusting your filter or search query parameters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const avatarClass = getAvatarColorClass(u.username);
                  const isOnline = u.online === 'Online';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shadow-sm shrink-0 ${avatarClass}`}>
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight flex items-center gap-2">
                              {u.username}
                              {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-wider">ID: {u.id.substring(0, 8)}…</div>
                            <Badge variant={isOnline ? 'success' : 'neutral'} className="text-[9px] font-black py-0 px-1.5 uppercase">
                              {u.online}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {u.email}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            {u.phone}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {u.referred_by_username ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-1 rounded-md border border-indigo-500/10 w-fit">
                              <UserCheck className="w-3 h-3" />
                              {u.referred_by_username}
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Unbound</span>
                          )}
                          <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            CODE: {u.inviteCode}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-4 bg-indigo-500/5 px-2.5 py-1.5 rounded-lg border border-indigo-500/10 min-w-[120px]">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Balance</span>
                            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 font-mono">${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/10 min-w-[120px]">
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Escrow</span>
                            <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-mono">${u.frozen.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2 min-w-[140px]">
                          {u.usdt_address ? (
                            <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-fit">
                              <Coins className="w-3 h-3 text-teal-500" />
                              {u.usdt_address.substring(0, 10)}…{u.usdt_address.substring(u.usdt_address.length - 4)}
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">No Address</span>
                          )}
                          {u.bank_name && (
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2 space-y-1">
                              <div className="text-[9px] font-black text-indigo-600 flex items-center gap-1">
                                <Database className="w-2.5 h-2.5" />
                                {u.bank_name}
                              </div>
                              <div className="text-[9px] font-mono font-bold text-slate-500 leading-none">{u.bank_account}</div>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Deposits:</span>
                            <span className="text-sky-600 font-mono">${u.topup.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Profits:</span>
                            <span className="text-emerald-600 font-mono">${u.earnings.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Payouts:</span>
                            <span className="text-rose-600 font-mono">${u.withdrawals.toFixed(2)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          {u.ongoingTemplates && u.ongoingTemplates.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Ongoing</span>
                              {u.ongoingTemplates.map((tpl: string, i: number) => (
                                <Badge key={i} variant="warning" className="text-[9px] font-black py-0 px-1.5 uppercase truncate max-w-[100px]">
                                  {tpl}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {u.completedTemplates && u.completedTemplates.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Completed</span>
                              {u.completedTemplates.slice(0, 2).map((tpl: string, i: number) => (
                                <Badge key={i} variant="success" className="text-[9px] font-black py-0 px-1.5 uppercase truncate max-w-[100px]">
                                  {tpl}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleWithdraw(u)}
                          className={`h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-[0.95] flex items-center gap-2 mx-auto ${
                            (u.withdraw === 'Enable' || u.withdraw === 'Enabled')
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          {(u.withdraw === 'Enable' || u.withdraw === 'Enabled') ? (
                            <><ShieldCheck className="w-3.5 h-3.5" /> Unlock</>
                          ) : (
                            <><Lock className="w-3.5 h-3.5" /> Lock</>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewUser(u)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all"
                            title="View Records"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(u)}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-500 hover:text-indigo-600 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openResetPasswords(u)}
                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/40 text-amber-500 hover:text-amber-600 rounded-lg transition-all"
                            title="Security Reset"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-500 hover:text-rose-600 rounded-lg transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal */}
      {editUser && (
        <Modal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          title="Modify Client Profile"
        >
          <div className="space-y-6">
            <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed uppercase tracking-tight">
                Save updates directly modifies real-time databases. Ensure accuracy when altering net balances or escrows to prevent client reconciliation issues.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Username"
                value={editFields.username}
                onChange={e => setEditFields((f: any) => ({ ...f, username: e.target.value }))}
                icon={<User className="w-4 h-4" />}
              />
              <Input
                label="Email"
                type="email"
                value={editFields.email}
                onChange={e => setEditFields((f: any) => ({ ...f, email: e.target.value }))}
                icon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Phone"
                value={editFields.phone}
                onChange={e => setEditFields((f: any) => ({ ...f, phone: e.target.value }))}
                icon={<Smartphone className="w-4 h-4" />}
              />
              <Input
                label="Login Password"
                value={editFields.password_plain}
                onChange={e => setEditFields((f: any) => ({ ...f, password_plain: e.target.value, password: e.target.value }))}
                icon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="Withdrawal Password"
                value={editFields.withdraw_password}
                onChange={e => setEditFields((f: any) => ({ ...f, withdraw_password: e.target.value }))}
                icon={<Shield className="w-4 h-4" />}
              />
              <Input
                label="Available Balance ($)"
                type="number"
                value={editFields.balance}
                onChange={e => setEditFields((f: any) => ({ ...f, balance: e.target.value }))}
                icon={<DollarSign className="w-4 h-4" />}
              />
              <Input
                label="Escrow Balance ($)"
                type="number"
                value={editFields.frozen}
                onChange={e => setEditFields((f: any) => ({ ...f, frozen: e.target.value }))}
                icon={<Briefcase className="w-4 h-4" />}
              />
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">User Tier Level</label>
                <select 
                  value={editFields.level} 
                  onChange={e => setEditFields((f: any) => ({ ...f, level: e.target.value }))} 
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="1">Tier 1</option>
                  <option value="2">Tier 2</option>
                  <option value="3">Tier 3</option>
                  <option value="4">Tier 4</option>
                  <option value="5">Tier 5</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Coins className="w-4 h-4 text-teal-500" />
                Payout Gateway Configurations
              </h4>
              <Input
                label="USDT Payout Destination (TRC20/ERC20)"
                value={editFields.usdt_address}
                onChange={e => setEditFields((f: any) => ({ ...f, usdt_address: e.target.value }))}
                className="font-mono"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bank Name"
                  value={editFields.bank_name}
                  onChange={e => setEditFields((f: any) => ({ ...f, bank_name: e.target.value }))}
                />
                <Input
                  label="Account Number"
                  value={editFields.bank_account}
                  onChange={e => setEditFields((f: any) => ({ ...f, bank_account: e.target.value }))}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Account Holder Name"
                    value={editFields.bank_holder}
                    onChange={e => setEditFields((f: any) => ({ ...f, bank_holder: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button 
                onClick={handleSaveEdit} 
                loading={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
              >
                Commit Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Security Reset Modal */}
      {resetPWUser && (
        <Modal
          isOpen={!!resetPWUser}
          onClose={() => setResetPWUser(null)}
          title="Security Credentials Reset"
        >
          <div className="space-y-6">
            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-tight">
                You are modifying the security credentials for {resetPWUser.username}. Ensure the client has authorized this reset.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="New Login Password"
                value={resetPWFields.loginPassword}
                onChange={e => setResetPWFields(f => ({ ...f, loginPassword: e.target.value }))}
                icon={<Lock className="w-4 h-4" />}
              />
              <Input
                label="New Withdrawal Password"
                value={resetPWFields.withdrawPassword}
                onChange={e => setResetPWFields(f => ({ ...f, withdrawPassword: e.target.value }))}
                icon={<ShieldCheck className="w-4 h-4" />}
                placeholder="Defaults to Login Password if empty"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button variant="secondary" onClick={() => setResetPWUser(null)}>Cancel</Button>
              <Button 
                onClick={handleSaveResetPW} 
                loading={resettingPW}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Update Credentials
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Records Modal */}
      {viewUser && (
        <Modal
          isOpen={!!viewUser}
          onClose={() => setViewUser(null)}
          title="Client Record Audit"
        >
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border shadow-sm ${getAvatarColorClass(viewUser.username)}`}>
                {viewUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{viewUser.username}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest py-0.5 px-2">TIER {viewUser.level}</Badge>
                  <span className="text-[10px] font-bold text-slate-400">REGISTERED {viewUser.regTime}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Available Assets</span>
                <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 font-mono tracking-tight">
                  ${viewUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-1">
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Escrow Escrow</span>
                <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono tracking-tight">
                  ${viewUser.frozen.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-sky-500" />
                Ledger Summaries
              </h5>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { label: 'Total Deposits', value: viewUser.topup, icon: ArrowUpRight, color: 'text-sky-500' },
                  { label: 'Net Earnings', value: viewUser.earnings, icon: TrendingUp, color: 'text-emerald-500' },
                  { label: 'Network Commissions', value: viewUser.commissions, icon: Award, color: 'text-indigo-500' },
                  { label: 'Total Withdrawals', value: viewUser.withdrawals, icon: ArrowRight, color: 'text-rose-500' }
                ].map((item, i) => (
                  <div key={i} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${item.color} bg-current/10 flex items-center justify-center`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{item.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">${item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                Network Connectivity
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SLA Referral Agent</span>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                    {viewUser.referred_by_username || 'None'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Admin Node</span>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                    {viewUser.member_of_admin_id || 'Global'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setViewUser(null)} className="w-full">Close Audit</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
