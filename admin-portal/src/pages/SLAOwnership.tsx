import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  UserX,
  Fingerprint,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Lock,
  Plus,
  RefreshCcw,
  Zap,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, Card, Input, Badge } from '../shared/UI';

const adminAuthClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

export default function SLAOwnership() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('cb_admins')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const mapped = data.map(a => ({
          id: a.id,
          accountId: a.account_id,
          name: a.name,
          email: a.email,
          phone: a.phone || 'Unassigned',
          status: a.status,
          createdAt: new Date(a.created_at).toLocaleDateString()
        }));
        setAdmins(mapped);
      }
    } catch (err) {
      console.error("Error loading admins:", err);
    }
  };

  useEffect(() => {
    fetchAdmins();
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchAdmins();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsCreating(true);
    const nextNum = admins.length + 1;
    const accountId = `AD${String(nextNum).padStart(2, '0')}`;

    try {
      const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
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

      const { data: newUserId, error: rpcError } = await supabase.rpc('create_admin_member', {
        p_email: email,
        p_password: password,
        p_name: name,
        p_phone: phone || 'Unassigned',
        p_account_id: accountId
      });

      if (rpcError) {
        toast.error("Database node error: " + rpcError.message);
        return;
      }

      toast.success(`Administrator ${accountId} node initialized!`);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      fetchAdmins();
      setShowModal(false);
    } catch (err: any) {
      toast.error("Operation failed: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const { error } = await supabase
        .from('cb_admins')
        .update({ status: newStatus })
        .eq('id', id);

      if (!error) {
        toast.success(`Node status updated to ${newStatus}`);
        fetchAdmins();
      } else {
        toast.error("Error updating status: " + error.message);
      }
    } catch (err: any) {
      toast.error("Error updating status: " + err.message);
    }
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setIsDeleting(true);

    try {
      const { error: deleteErr } = await supabase
        .from('cb_admins')
        .delete()
        .eq('id', adminToDelete.id);

      if (deleteErr) {
        if (deleteErr.message && deleteErr.message.toLowerCase().includes('foreign key')) {
          toast.error(`Restriction: ${adminToDelete.accountId} still has active staff sub-nodes.`);
        } else {
          toast.error("Node deletion error: " + deleteErr.message);
        }
        return;
      }

      await supabase.from('user_roles').delete().eq('user_id', adminToDelete.id);
      await supabase.rpc('delete_auth_user', { p_user_id: adminToDelete.id });

      toast.success(`Administrator node ${adminToDelete.accountId} decommissioned.`);
      fetchAdmins();
      setAdminToDelete(null);
    } catch (err: any) {
      toast.error("Decommissioning failed: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const activeAdmins = admins.filter(a => a.accountId !== 'OWNER');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              Ownership Governance
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Supervise root authority nodes, hierarchy structures, and system security keys.
            </p>
          </div>
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 text-[11px] font-black uppercase tracking-widest h-11 px-6"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Create Administrator Node
          </Button>
        </div>
      </Card>

      {/* Root Authority Section */}
      <Card className="p-6 bg-[#0a0c10] border-amber-500/20 relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50" />
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-48 h-48 text-amber-500" />
         </div>
         
         <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 rounded-[24px] bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0">
               <Fingerprint className="w-8 h-8" />
            </div>
            <div className="space-y-3 flex-1">
               <div className="flex items-center gap-3">
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Root Authority Node (ROLE: OWNER)</h4>
                  <Badge variant="warning" className="bg-amber-400 text-slate-950 border-none font-black px-3 py-1">MASTER KEY ACTIVE</Badge>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed max-w-3xl font-medium">
                  The system ownership account holds absolute root sovereignty. It is responsible for provisioning administrative nodes (AD-Nodes), managing global payment infrastructure, and has unrestricted visibility across the entire data mesh. All AD-Nodes are direct subordinates to this authority.
               </p>
               <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Global Heartbeat Active</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <ShieldCheck className="w-3 h-3 text-amber-500" />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantum Encryption Engaged</span>
                  </div>
               </div>
            </div>
         </div>
      </Card>

      {/* Admin Nodes Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Delegated Administrative Nodes</h4>
           <Badge variant="outline" className="text-[10px] font-black uppercase px-3 py-1">{activeAdmins.length} Active Nodes</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Node ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credentials</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialized</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                     <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-slate-200 dark:text-slate-800 animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Delegated Nodes Found</p>
                     </div>
                  </td>
                </tr>
              ) : (
                activeAdmins.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">#{a.accountId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{a.name}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                             <Mail className="w-3 h-3 text-slate-400" /> {a.email}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                             <Phone className="w-3 h-3 text-slate-400" /> {a.phone}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{a.createdAt}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={a.status === 'Active' ? 'success' : 'error'} className="text-[9px] font-black py-0.5 px-2 uppercase">{a.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className={`h-8 text-[10px] font-black uppercase ${a.status === 'Active' ? 'text-rose-600' : 'text-emerald-600'}`}
                          onClick={() => toggleStatus(a.id, a.status)}
                        >
                          {a.status === 'Active' ? 'Suspend' : 'Activate'}
                        </Button>
                        <button 
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                          onClick={() => setAdminToDelete(a)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Initialize Admin Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Initialize Administrative Node"
        >
          <form onSubmit={handleCreateAdmin} className="space-y-6">
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed uppercase tracking-tight">
                Initializing a new administrative node will grant it supervision over its own staff pool and designated client segments. Secure credentials should only be issued to trusted system controllers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="CONTROLLER FULL NAME" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Richard Hendricks" icon={<Fingerprint className="w-4 h-4" />} />
              <Input label="SECURITY EMAIL ADDRESS" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="richard@walmark.com" icon={<Mail className="w-4 h-4" />} />
              <Input label="CONTACT PHONE (OPTIONAL)" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 000" icon={<Phone className="w-4 h-4" />} />
              <Input label="NODE ACCESS PASSWORD" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" icon={<Lock className="w-4 h-4" />} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
               <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
               <Button type="submit" loading={isCreating} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 text-[11px] font-black uppercase tracking-widest">
                  Commission Admin Node
               </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Decommission Confirmation Modal */}
      {adminToDelete && (
        <Modal
          isOpen={!!adminToDelete}
          onClose={() => setAdminToDelete(null)}
          title="Node Decommissioning Alert"
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-16 h-16 rounded-[24px] bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Permanent Node Erasure</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    You are about to permanently decommission the administrative node for <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">{adminToDelete.name}</span>. This action is irreversible and requires all staff sub-nodes to be deleted first.
                  </p>
               </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setAdminToDelete(null)} className="flex-1">Abort Operation</Button>
              <Button 
                variant="danger"
                className="flex-1 shadow-lg shadow-rose-500/20"
                onClick={confirmDeleteAdmin}
                loading={isDeleting}
              >
                Confirm Erasure
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
