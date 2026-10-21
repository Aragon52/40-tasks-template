import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { 
  Shield, 
  Key, 
  Camera, 
  Save, 
  Coins, 
  Lock, 
  User, 
  Check, 
  Link, 
  AlertTriangle,
  Eye,
  Settings as SettingsIcon,
  Bitcoin,
  TrendingUp,
  Mail,
  ShieldCheck,
  RefreshCcw,
  Zap,
  Globe,
  Info
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../shared/UI';

export default function Settings() {
  const [session, setSession] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [cryptoAddresses, setCryptoAddresses] = useState<any>({
    usdt_address: '',
    usdt_erc20_address: '',
    btc_address: '',
    eth_address: '',
    bnb_address: '',
    xrp_address: '',
    sol_address: '',
    doge_address: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('cb_admin_session');
    if (saved) {
      setSession(JSON.parse(saved));
    }
    fetchUsdtAddress();
  }, []);

  const fetchUsdtAddress = async () => {
    try {
      const { data, error } = await supabase
        .from('cb_deposit_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (!error && data) {
        setCryptoAddresses({
          usdt_address:       data.usdt_address       || '',
          usdt_erc20_address: data.usdt_erc20_address || '',
          btc_address:        data.btc_address        || '',
          eth_address:        data.eth_address        || '',
          bnb_address:        data.bnb_address        || '',
          xrp_address:        data.xrp_address        || '',
          sol_address:        data.sol_address        || '',
          doge_address:       data.doge_address       || '',
        });
      }
    } catch (err) {
      console.error('Error fetching deposit settings:', err);
    }
  };

  const handlePhotoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !photoUrl) return;

    setLoading(true);
    try {
      const table = session.role === 'Staff' ? 'cb_staff' : 'cb_admins';
      const { error } = await supabase
        .from(table)
        .update({ profile_photo: photoUrl })
        .eq('email', session.email);

      if (error) {
        toast.error("Failed to update profile photo: " + error.message);
      } else {
        toast.success("Profile photo updated successfully!");
        const updatedSession = { ...session, avatarUrl: photoUrl };
        setSession(updatedSession);
        localStorage.setItem('cb_admin_session', JSON.stringify(updatedSession));
        setPhotoUrl('');
      }
    } catch (err) {
      toast.error("Error updating profile photo.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        toast.error("Failed to update password: " + error.message);
      } else {
        toast.success("Password updated securely!");
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error("Error updating password.");
    } finally {
      setLoading(false);
    }
  };

  const handleUsdtUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cb_deposit_settings')
        .update(cryptoAddresses)
        .eq('id', 1);

      if (error) {
        toast.error('Failed to update deposit addresses: ' + error.message);
      } else {
        toast.success('All crypto deposit addresses updated successfully!');
      }
    } catch (err) {
      toast.error('Error updating deposit settings.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verifying Node Integrity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-lg group-hover:border-indigo-500 transition-all duration-300">
                {session.avatarUrl || session.profile_photo ? (
                  <img src={session.avatarUrl || session.profile_photo} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{session.name || session.email}</h2>
                <Badge variant="success" className="text-[9px] font-black uppercase tracking-widest py-0.5 px-2">{session.role}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500">{session.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Node</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-right">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Connection</div>
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Fully Operational</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <RefreshCcw className="w-5 h-5 animate-spin-slow" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Identity Visuals</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Update your platform avatar</p>
            </div>
          </div>

          <form onSubmit={handlePhotoUpdate} className="space-y-5">
            <Input
              label="AVATAR IMAGE URL (HTTPS)"
              placeholder="https://images.unsplash.com/photo..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              icon={<Link className="w-4 h-4" />}
            />

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
               <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
                  {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover rounded-lg" /> : <User className="w-6 h-6 text-slate-300" />}
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Preview</span>
                 <p className="text-[10px] font-bold text-slate-500 leading-tight">Image will update across all administrative panels upon saving.</p>
               </div>
            </div>

            <Button 
              type="submit" 
              loading={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 text-[11px] font-black uppercase tracking-widest"
              icon={<Save className="w-4 h-4" />}
            >
              Commit Visual Update
            </Button>
          </form>
        </Card>

        {/* Security Card */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Security Protocols</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rotate access credentials</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="NEW PASSWORD"
                type="password"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                icon={<Key className="w-4 h-4" />}
              />
              <Input
                label="CONFIRM ROTATION"
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                icon={<ShieldCheck className="w-4 h-4" />}
              />
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-tight">
                Passwords must be at least 8 characters. Changing your password will invalidate active sessions on other devices.
              </p>
            </div>

            <Button 
              type="submit" 
              loading={loading}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-lg text-[11px] font-black uppercase tracking-widest"
              icon={<Zap className="w-4 h-4" />}
            >
              Rotate Security Key
            </Button>
          </form>
        </Card>

        {/* Global Wallet Settings (Owner Only) */}
        {session.role === 'Owner' && (
          <Card className="p-6 lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Bitcoin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Global Payment Nodes</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configure primary receiving destinations</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUsdtUpdate} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { key: 'usdt_address',       label: 'USDT (TRC20)',    color: 'text-emerald-500' },
                  { key: 'usdt_erc20_address', label: 'USDT (ERC20)',    color: 'text-indigo-500' },
                  { key: 'btc_address',        label: 'Bitcoin (BTC)',   color: 'text-amber-500' },
                  { key: 'eth_address',        label: 'Ethereum (ETH)',  color: 'text-blue-500' },
                  { key: 'bnb_address',        label: 'BNB (Smart Chain)', color: 'text-yellow-500' },
                  { key: 'xrp_address',        label: 'Ripple (XRP)',    color: 'text-slate-400' },
                  { key: 'sol_address',        label: 'Solana (SOL)',    color: 'text-purple-500' },
                  { key: 'doge_address',       label: 'Dogecoin (DOGE)', color: 'text-orange-500' },
                ].map(({ key, label, color }) => (
                  <div key={key} className="space-y-1.5">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${color}`}>{label}</label>
                    <input
                      type="text"
                      placeholder="Node Not Bound"
                      value={cryptoAddresses[key]}
                      onChange={e => setCryptoAddresses((prev: any) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-400 placeholder:italic"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                    Leave any node blank to temporarily disable that payment channel in the user dashboard.
                  </span>
                </div>
                <Button 
                  type="submit" 
                  loading={loading}
                  className="px-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 text-[11px] font-black uppercase tracking-widest"
                  icon={<Save className="w-4 h-4" />}
                >
                  Deploy Global Node Updates
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
