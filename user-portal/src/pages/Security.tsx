import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { 
  Shield, 
  Lock, 
  Camera, 
  ChevronLeft, 
  Save, 
  Key, 
  User as UserIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button, Input, Card } from '@/src/shared/UI';

export default function Security() {
  const navigate = useNavigate();
  const username = localStorage.getItem('cb_username') || '';

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      const { data: users, error: fetchError } = await supabase
        .from('cb_users')
        .select('*')
        .eq('username', username);

      if (fetchError || !users || users.length === 0) {
        toast.error("Authentication error: Could not verify user.");
        setLoading(false);
        return;
      }

      const user = users[0];
      if (user.password && user.password !== passwordForm.currentPassword) {
        toast.error("Incorrect current password.");
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('cb_users')
        .update({ password: passwordForm.newPassword })
        .eq('username', username);

      if (updateError) {
        toast.error("Failed to update password: " + updateError.message);
      } else {
        toast.success("Password updated successfully!");
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error("Error updating password.");
    }
    setLoading(false);
  };

  const handlePhotoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cb_users')
        .update({ profile_photo: photoUrl })
        .eq('username', username);

      if (error) {
        toast.error("Failed to update profile photo: " + error.message);
        if (error.code === '42703') {
           toast.error("Database Schema Error: The profile_photo column does not exist.");
        }
      } else {
        toast.success("Profile photo updated successfully!");
        setPhotoUrl('');
      }
    } catch (err) {
      toast.error("Error updating profile photo.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-ivory dark:bg-slate-950 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Security Settings</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">
        {/* Profile Identity Status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Shield size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserIcon size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{username}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={10} />
                  Verified Node
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Photo Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Camera size={18} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Update Avatar</h3>
          </div>
          
          <form onSubmit={handlePhotoUpdate} className="space-y-4">
            <Input 
              label="Image URL"
              type="url" 
              placeholder="https://example.com/avatar.jpg" 
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              required
              helperText="Provide a valid direct image link to update your profile visual."
            />
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl"
              disabled={loading || !photoUrl}
              icon={<Save size={18} />}
            >
              {loading ? 'Updating...' : 'Save Profile Visual'}
            </Button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-premium">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Lock size={18} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Change Credential</h3>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input 
              label="Current Password"
              type="password" 
              placeholder="••••••••" 
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              required
            />
            <Input 
              label="New Access Key"
              type="password" 
              placeholder="••••••••" 
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              required
            />
            <Input 
              label="Confirm Key"
              type="password" 
              placeholder="••••••••" 
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              required
            />
            
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Ensure your new access key is unique and not used elsewhere. Password changes require immediate re-authentication.
              </p>
            </div>

            <Button 
              type="submit" 
              variant="outline"
              className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700"
              disabled={loading}
              icon={<Key size={18} />}
            >
              {loading ? 'Rotating Keys...' : 'Rotate Security Key'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
