import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  MoreVertical, 
  Mail, 
  Smartphone, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  X,
  Plus,
  Lock,
  Loader2,
  Trash2,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { Button, Modal, Card, Input, Badge } from '../shared/UI';

const adminAuthClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

export default function SLAAdmins() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const updatingStaffIdsRef = useRef(new Set());

  // Form states for creating staff
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffDept, setStaffDept] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchAdminsAndStaff = async () => {
    try {
      const savedSession = localStorage.getItem('cb_admin_session');
      const parsedSession = savedSession ? JSON.parse(savedSession) : { role: 'Owner', name: 'System Owner', email: 'owner@wallmark.com' };
      setSession(parsedSession);

      const { data: adminsData, error: adminsError } = await supabase
        .from('cb_admins')
        .select('*')
        .order('created_at', { ascending: true });

      if (!adminsError && adminsData) {
        const mappedAdmins = adminsData.map(a => ({
          id: a.id,
          accountId: a.account_id,
          name: a.name,
          email: a.email,
          phone: a.phone || 'Unassigned',
          status: a.status,
          createdAt: new Date(a.created_at).toLocaleDateString()
        }));
        setAdmins(mappedAdmins);
      }

      const { data: staffData, error: staffError } = await supabase
        .from('cb_staff')
        .select('*')
        .order('created_at', { ascending: true });

      if (!staffError && staffData) {
        setStaff(prevStaff => {
          return staffData.map(s => {
            const isUpdating = updatingStaffIdsRef.current.has(s.id);
            const existing = prevStaff.find(x => x.id === s.id);
            return {
              id: s.id,
              staffId: s.staff_id,
              name: s.name,
              email: s.email,
              phone: s.phone || 'Unassigned',
              status: s.status,
              createdByAdminId: s.created_by_admin_id,
              department: s.department || 'Operations',
              referralCode: s.referral_code,
              profile_photo: (isUpdating && existing) ? existing.profile_photo : s.profile_photo,
              createdAt: new Date(s.created_at).toLocaleDateString()
            };
          });
        });
      }
    } catch (err) {
      console.error("Error fetching admins and staff:", err);
    }
  };

  useEffect(() => {
    fetchAdminsAndStaff();
    const interval = setInterval(() => {
      if (document.hidden) return; 
      fetchAdminsAndStaff();
    }, 20000); 
    return () => clearInterval(interval);
  }, []);

  const displayAdmins = admins.filter(a => {
    if (a.accountId === 'OWNER') return false; 
    if (!session || session.role === 'Owner') return true;
    if (session.role === 'Admin') return a.accountId === session.accountId;
    return false;
  });

  const handleOpenCreateStaff = (admin: any) => {
    setSelectedAdminId(admin.accountId);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffDept('');
    setStaffPassword('');
    setShowModal(true);
  };

  const handleOpenGeneralCreateStaff = () => {
    if (session && session.role === 'Owner') {
      const activeAdmins = admins.filter(a => a.status === 'Active' && a.accountId !== 'OWNER');
      if (activeAdmins.length > 0) {
        setSelectedAdminId(activeAdmins[0].accountId);
      } else {
        setSelectedAdminId('');
      }
    } else if (session) {
      setSelectedAdminId(session.accountId || '');
    }
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffDept('');
    setStaffPassword('');
    setShowModal(true);
  };

  const generateReferralCode = (staffId: string) => {
    let adminId = 'OWNER';
    const match = staffId.match(/^(AD\d+)SI(\d+)$/);
    if (match) {
      adminId = match[1];
    } else {
      adminId = selectedAdminId || 'OWNER';
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `WK${randomPart}${adminId}`;
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword) {
      toast.error("Please fill in name, email, and password.");
      return;
    }

    setIsCreating(true);
    const staffUnderAdmin = staff.filter(s => s.createdByAdminId === selectedAdminId);
    const nextNum = staffUnderAdmin.length + 1;
    const staffId = `${selectedAdminId}SI${nextNum}`;
    const referralCode = generateReferralCode(staffId);

    try {
      const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
        email: staffEmail,
        password: staffPassword,
        options: {
          data: {
            name: staffName,
            email_verified: true
          }
        }
      });

      if (authError) {
        toast.error("Auth account error: " + authError.message);
        return;
      }

      if (!authData?.user) {
        toast.error("Failed to create authentication credentials.");
        return;
      }

      const { data: newUserId, error: rpcError } = await supabase.rpc('create_staff_member', {
        p_email: staffEmail,
        p_password: staffPassword,
        p_name: staffName,
        p_phone: staffPhone || 'Unassigned',
        p_staff_id: staffId,
        p_admin_id: selectedAdminId,
        p_department: staffDept || 'Operations',
        p_referral_code: referralCode
      });

      if (rpcError) {
        toast.error("Staff account error: " + rpcError.message);
        return;
      }

      if (!newUserId) {
        toast.error("Failed to retrieve system ID.");
        return;
      }

      const auditLog = {
        id: Date.now().toString(),
        admin_email: session?.email || 'admin@wallmark.com',
        action: 'CREATE_STAFF',
        target: staffId,
        details: { name: staffName, referralCode },
        timestamp: new Date().toISOString()
      };

      await supabase.from('cb_audit_logs').insert([auditLog]);

      toast.success(`Staff Member ${staffId} (${staffName}) created!`);
      setShowModal(false);
      fetchAdminsAndStaff();
    } catch (err: any) {
      toast.error("Operation failed: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleAdminStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const { error } = await supabase
        .from('cb_admins')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        toast.error("Error updating status: " + error.message);
        return;
      }

      toast.success(`Admin node status changed to ${newStatus}.`);
      fetchAdminsAndStaff();
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const getStaffPermissions = (profilePhoto: any) => {
    let perms = {
      userManagement: true,
      ordersInProgress: true,
      orderTasking: false,
      financialCenter: false,
      supportChat: false
    };
    if (profilePhoto) {
      if (typeof profilePhoto === 'object') {
        perms = { ...perms, ...profilePhoto };
      } else {
        try {
          const parsed = JSON.parse(profilePhoto);
          if (parsed && typeof parsed === 'object') {
            perms = { ...perms, ...parsed };
          }
        } catch (e) {
          // Ignore
        }
      }
    }
    return perms;
  };

  const handleTogglePermission = async (staffMember: any, field: string) => {
    const currentPerms = getStaffPermissions(staffMember.profile_photo);
    const updatedPerms = {
      ...currentPerms,
      [field]: !currentPerms[field]
    };

    const updatedPhotoStr = JSON.stringify(updatedPerms);
    updatingStaffIdsRef.current.add(staffMember.id);

    setStaff(prevStaff => prevStaff.map(s => {
      if (s.id === staffMember.id) {
        return { ...s, profile_photo: updatedPhotoStr };
      }
      return s;
    }));

    try {
      const { error } = await supabase
        .from('cb_staff')
        .update({ profile_photo: updatedPhotoStr })
        .eq('id', staffMember.id);

      if (error) throw error;
      toast.success(`Permission updated for ${staffMember.name}`);
      updatingStaffIdsRef.current.delete(staffMember.id);
      fetchAdminsAndStaff();
    } catch (err: any) {
      toast.error("Failed to update permission: " + err.message);
      updatingStaffIdsRef.current.delete(staffMember.id);
      fetchAdminsAndStaff(); 
    }
  };

  const ownStaff = staff.filter(s => {
    if (!session) return false;
    if (session.role === 'Owner') return true;
    if (session.role === 'Admin') return s.createdByAdminId === session.accountId;
    return false;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-500" />
              Administrator Nodes
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Manage system administrator nodes and operational staff hierarchies.
            </p>
          </div>
          <Button 
            onClick={handleOpenGeneralCreateStaff}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 text-[11px] font-black uppercase tracking-widest h-11 px-6"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Staff Account
          </Button>
        </div>
      </Card>

      {/* Admin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayAdmins.map(admin => {
          const myStaffCount = staff.filter(s => s.createdByAdminId === admin.accountId).length;
          const isActive = admin.status === 'Active';

          return (
            <Card key={admin.id} className="p-6 flex flex-col h-full group hover:border-indigo-500/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1.5">
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 font-mono">{admin.accountId}</Badge>
                  <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{admin.name}</h4>
                </div>
                <Badge variant={isActive ? 'success' : 'error'} className="text-[9px] font-black uppercase py-0.5 px-2">
                  {admin.status}
                </Badge>
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {admin.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    {admin.phone}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Staff</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">{myStaffCount} Units</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                {session?.role === 'Owner' && (
                  <Button 
                    variant="secondary"
                    className={`flex-1 h-9 text-[10px] font-black uppercase ${isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    onClick={() => toggleAdminStatus(admin.id, admin.status)}
                  >
                    {isActive ? 'Suspend' : 'Activate'}
                  </Button>
                )}
                <Button 
                  className="flex-1 h-9 text-[10px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleOpenCreateStaff(admin)}
                  disabled={!isActive}
                >
                  Add Staff
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Staff Permissions Section */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Node Access Matrix</h4>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Configure granular permissions for secondary operational staff</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-black uppercase px-3 py-1">{ownStaff.length} Operatives</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operative</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">User Mgmt</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tasking</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">In-Progress</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Financials</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ownStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-xs font-medium">No staff operatives bound to your node.</td>
                </tr>
              ) : (
                ownStaff.map(s => {
                  const perms = getStaffPermissions(s.profile_photo);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                            {s.name.substring(0,2)}
                          </div>
                          <div>
                             <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.name}</div>
                             <div className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">{s.staffId} • {s.department}</div>
                          </div>
                        </div>
                      </td>
                      {[
                        { key: 'userManagement', color: 'bg-indigo-600' },
                        { key: 'orderTasking', color: 'bg-emerald-600' },
                        { key: 'ordersInProgress', color: 'bg-sky-600' },
                        { key: 'financialCenter', color: 'bg-amber-600' },
                        { key: 'supportChat', color: 'bg-rose-600' }
                      ].map(p => (
                        <td key={p.key} className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleTogglePermission(s, p.key)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              perms[p.key as keyof typeof perms] ? p.color : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${perms[p.key as keyof typeof perms] ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Staff Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Commission Secure Operative"
        >
          <form onSubmit={handleCreateStaff} className="space-y-6">
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl flex items-start gap-3">
              <Fingerprint className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed uppercase tracking-tight">
                New operatives will be granted immediate access to the administrative dashboard under your node's supervision. Credentials must be shared securely.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {session?.role === 'Owner' ? (
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ADMINISTRATOR NODE BINDING</label>
                  <select 
                    value={selectedAdminId} 
                    onChange={(e) => setSelectedAdminId(e.target.value)} 
                    required 
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 appearance-none transition-all"
                  >
                    <option value="">-- Select Target Admin Node --</option>
                    {admins.filter(a => a.status === 'Active' && a.accountId !== 'OWNER').map(a => (
                      <option key={a.id} value={a.accountId}>{a.name} ({a.accountId})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input label="PARENT NODE ID" value={selectedAdminId} disabled icon={<Building2 className="w-4 h-4" />} />
              )}

              <Input label="FULL NAME" value={staffName} onChange={e => setStaffName(e.target.value)} required placeholder="e.g. Michael Chen" icon={<Fingerprint className="w-4 h-4" />} />
              <Input label="EMAIL ADDRESS" type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required placeholder="chen@walmark.com" icon={<Mail className="w-4 h-4" />} />
              <Input label="PHONE (OPTIONAL)" value={staffPhone} onChange={e => setStaffPhone(e.target.value)} placeholder="+1 000 000 000" icon={<Smartphone className="w-4 h-4" />} />
              <Input label="DEPARTMENT" value={staffDept} onChange={e => setStaffDept(e.target.value)} placeholder="e.g. Risk Audit" icon={<Building2 className="w-4 h-4" />} />
              <div className="sm:col-span-2">
                <Input label="ACCESS PASSWORD" type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required placeholder="••••••••" icon={<Lock className="w-4 h-4" />} />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" loading={isCreating} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 text-[11px] font-black uppercase tracking-widest">
                 Initialize Staff Node
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
