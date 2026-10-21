import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Users, 
  UserPlus, 
  Search, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink, 
  AlertTriangle, 
  Phone, 
  Mail, 
  Building2, 
  Calendar,
  ChevronRight,
  Fingerprint,
  Link,
  Globe,
  Loader2,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input, Badge } from '../shared/UI';

export default function SLAStaff() {
  const [session, setSession] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStaffAndClients = async () => {
    try {
      const savedSession = localStorage.getItem('cb_admin_session');
      const parsedSession = savedSession ? JSON.parse(savedSession) : { role: 'Owner', name: 'System Owner', email: 'owner@wallmark.com' };
      setSession(parsedSession);

      const { data: staffData, error: staffError } = await supabase
        .from('cb_staff')
        .select('*')
        .order('created_at', { ascending: true });

      if (!staffError && staffData) {
        const mappedStaff = staffData.map(s => ({
          id: s.id,
          staffId: s.staff_id,
          name: s.name,
          email: s.email,
          phone: s.phone || 'Unassigned',
          status: s.status,
          createdByAdminId: s.created_by_admin_id,
          department: s.department || 'Operations',
          referralCode: s.referral_code,
          createdAt: new Date(s.created_at).toLocaleDateString()
        }));
        setStaff(mappedStaff);
      }

      const { data: usersData, error: usersError } = await supabase
        .from('cb_users')
        .select('*')
        .order('reg_time', { ascending: false });

      if (!usersError && usersData) {
        const mappedUsers = usersData.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          nickname: u.nickname,
          level: u.level,
          online: u.online,
          balance: parseFloat(u.balance || 0),
          withdraw: u.withdraw,
          referred_by_staff_id: u.referred_by_staff_id,
          member_of_admin_id: u.member_of_admin_id,
          regTime: new Date(u.reg_time).toLocaleDateString()
        }));
        setClients(mappedUsers);
      }
    } catch (err) {
      console.error("Error loading staff and clients:", err);
    }
  };

  useEffect(() => {
    fetchStaffAndClients();
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchStaffAndClients();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const displayStaff = staff.filter(s => {
    if (!session) return false;
    if (session.role === 'Owner') return true;
    if (session.role === 'Admin') return s.createdByAdminId === session.accountId;
    if (session.role === 'Staff') return s.staffId === session.accountId;
    return false;
  });

  const filteredStaff = displayStaff.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.staffId.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      (s.referralCode && s.referralCode.toLowerCase().includes(q)) ||
      (s.createdByAdminId && s.createdByAdminId.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (filteredStaff.length > 0 && !selectedStaff) {
      setSelectedStaff(filteredStaff[0]);
    }
  }, [filteredStaff, selectedStaff]);

  useEffect(() => {
    if (selectedStaff) {
      const refreshed = staff.find(s => s.id === selectedStaff.id);
      if (refreshed) setSelectedStaff(refreshed);
    }
  }, [staff, selectedStaff]);

  const getReferralLink = (referralCode: string) => {
    let userPortalUrl = import.meta.env.VITE_USER_PORTAL_URL;
    if (!userPortalUrl) {
      const hostname = window.location.hostname;
      if (hostname.includes('ais-dev') || hostname.includes('ais-pre')) {
         userPortalUrl = `${window.location.protocol}//${hostname}`;
      } else {
         userPortalUrl = `${window.location.protocol}//${hostname}`;
      }
    }
    return `${userPortalUrl}/#/register?ref=${referralCode}`;
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Referral code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleStaffStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const { error } = await supabase
        .from('cb_staff')
        .update({ status: nextStatus })
        .eq('id', id);

      if (!error) {
        toast.success(`Staff status updated to ${nextStatus}`);
        fetchStaffAndClients();
      } else {
        toast.error("Failed to update staff status: " + error.message);
      }
    } catch (err: any) {
      toast.error("Error updating status: " + err.message);
    }
  };

  const staffClients = selectedStaff 
    ? clients.filter(c => c.referred_by_staff_id === selectedStaff.staffId)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-500" />
              SLA Staff Management
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Operational staff accounts, referral configurations, and client node bindings.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 px-4 py-2 rounded-2xl">
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{filteredStaff.length} Nodes Active</span>
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Staff Directory */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Operative Directory</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or dept..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                />
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 custom-scrollbar">
              {filteredStaff.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic opacity-50">No matching operatives</div>
              ) : (
                filteredStaff.map(s => {
                  const isSelected = selectedStaff?.id === s.id;
                  const myClientCount = clients.filter(c => c.referred_by_staff_id === s.staffId).length;

                  return (
                    <button 
                      key={s.id} 
                      onClick={() => setSelectedStaff(s)}
                      className={`w-full p-4 text-left transition-all flex items-center justify-between group ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border shadow-sm shrink-0 transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                          {s.name.substring(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[11px] font-black uppercase tracking-tight truncate block ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{s.name}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="font-mono text-indigo-500/70">{s.staffId}</span>
                            <span>•</span>
                            <span className="truncate">{s.department}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge 
                          variant={s.status === 'Active' ? 'success' : 'error'} 
                          className="text-[8px] font-black py-0 px-1.5 uppercase"
                        >
                          {s.status}
                        </Badge>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mt-1">{myClientCount} Users</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Staff Profile */}
        <div className="lg:col-span-7">
          {selectedStaff ? (
            <div className="space-y-6">
              <Card className="space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-indigo-600/20">
                      {selectedStaff.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedStaff.name}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-black uppercase font-mono">{selectedStaff.staffId}</Badge>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedStaff.department}</span>
                      </div>
                    </div>
                  </div>

                  {session && session.role !== 'Staff' && (
                    <Button 
                      variant="secondary"
                      size="sm"
                      className={`h-9 text-[10px] font-black uppercase ${selectedStaff.status === 'Active' ? 'text-rose-600' : 'text-emerald-600'}`}
                      onClick={() => toggleStaffStatus(selectedStaff.id, selectedStaff.status)}
                    >
                      {selectedStaff.status === 'Active' ? 'Suspend Node' : 'Activate Node'}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Mail className="w-3 h-3" /> Email Identity
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{selectedStaff.email}</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Phone className="w-3 h-3" /> Contact Phone
                      </div>
                      <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">{selectedStaff.phone}</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" /> Commissioned
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{selectedStaff.createdAt}</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3 text-indigo-500" /> Parent Admin
                      </div>
                      <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">{selectedStaff.createdByAdminId || 'ROOT'}</div>
                   </div>
                </div>

                <div className="space-y-4 pt-4 relative z-10 border-t border-slate-100 dark:border-slate-800">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referral Governance</h4>
                   <div className="p-5 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-600/20 text-white space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-70 text-white">Direct Referral Code</span>
                            <div className="text-2xl font-black font-mono tracking-tighter">{selectedStaff.referralCode}</div>
                         </div>
                         <button 
                           onClick={() => handleCopyLink(selectedStaff.referralCode, selectedStaff.id)}
                           className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                         >
                           {copiedId === selectedStaff.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                         </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-70">
                          <Globe className="w-3 h-3" /> Onboarding URL
                        </div>
                        <div className="relative group">
                          <input 
                            readOnly 
                            value={getReferralLink(selectedStaff.referralCode)} 
                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-[10px] font-mono font-bold outline-none cursor-pointer group-hover:bg-black/30 transition-all"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                          />
                          <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 pt-6 relative z-10 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Client Accounts ({staffClients.length})</h4>
                  </div>
                  
                  {staffClients.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                       <Fingerprint className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Client Bindings Detected</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-5 py-4">Client Identity</th>
                              <th className="px-5 py-4">Assets</th>
                              <th className="px-5 py-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {staffClients.map(c => (
                              <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="space-y-0.5">
                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.username}</div>
                                    <div className="text-[9px] font-bold text-slate-400 font-mono tracking-tighter">ID: {c.id.substring(0,8)}…</div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-lg w-fit">
                                    <DollarSign className="w-3 h-3 text-emerald-500" />
                                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">${c.balance.toFixed(2)}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <Badge 
                                    variant={c.online === 'Online' ? 'success' : 'neutral'} 
                                    className="text-[8px] font-black py-0 px-1.5 uppercase"
                                  >
                                    {c.online}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div className="w-20 h-20 rounded-[28px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-xl">
                 <Users className="w-8 h-8 text-slate-200 dark:text-slate-700" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Staff Node Intelligence</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Select an operative from the directory to review node metadata, modify status, and audit assigned client bindings.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
