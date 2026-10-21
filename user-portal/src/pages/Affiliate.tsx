import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Affiliate() {
  const navigate = useNavigate();
  const username = localStorage.getItem('cb_username') || '';
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [inviter, setInviter] = useState(null);
  const [referredUsers, setReferredUsers] = useState([]);
  
  // Binding section states
  const [referralInput, setReferralInput] = useState('');
  const [binding, setBinding] = useState(false);

  // Copy helper
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const fetchAffiliateData = async () => {
    if (!username) return;
    setLoading(true);
    try {
      // 1. Fetch current user profile
      const { data: users, error: profileErr } = await supabase
        .from('cb_users')
        .select('*')
        .eq('username', username);

      if (profileErr) throw profileErr;
      if (!users || users.length === 0) {
        toast.error('User profile not found');
        return;
      }

      const curProfile = users[0];
      
      // Ensure a unique invitation code is generated if it doesn't exist
      if (!curProfile.invite_code) {
        const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error: updateErr } = await supabase
          .from('cb_users')
          .update({ invite_code: generatedCode })
          .eq('id', curProfile.id);
        if (!updateErr) {
          curProfile.invite_code = generatedCode;
        }
      }

      setProfile(curProfile);

      // 2. Fetch referrer information if already bound
      if (curProfile.invited_by_user_id) {
        const { data: inviters, error: inviterErr } = await supabase
          .from('cb_users')
          .select('id, username')
          .eq('id', curProfile.invited_by_user_id);
          
        if (!inviterErr && inviters && inviters.length > 0) {
          setInviter(inviters[0]);
        }
      } else {
        setInviter(null);
      }

      // 3. Fetch list of referred downlines
      const { data: referrals, error: refErr } = await supabase
        .from('cb_users')
        .select('id, username, reg_time, level, balance')
        .eq('invited_by_user_id', curProfile.id)
        .order('reg_time', { ascending: false });

      if (refErr) throw refErr;
      setReferredUsers(referrals || []);

    } catch (err) {
      console.error('Error fetching affiliate page data:', err);
      toast.error('Failed to load affiliate details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateData();
  }, [username]);

  // Bind referral code logic
  const handleBindReferral = async (e) => {
    e.preventDefault();
    const code = referralInput.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter an invitation code');
      return;
    }

    if (!profile) {
      toast.error('Profile not initialized');
      return;
    }

    if (code === profile.invite_code) {
      toast.error('You cannot refer your own account');
      return;
    }

    setBinding(true);
    try {
      const cleanCode = code.trim().toUpperCase();
      const strippedCode = cleanCode.replace(/[^A-Z0-9]/g, '');

      // 1. Check cb_users first
      const { data: userList } = await supabase
        .from('cb_users')
        .select('id, username, phone, invite_code, referred_by_staff_id, member_of_admin_id');

      let targetInviter = (userList || []).find(u => {
        const uInv = (u.invite_code || '').trim().toUpperCase();
        const uName = (u.username || '').trim().toUpperCase();
        const uPhone = (u.phone || '').trim().toUpperCase();
        const uInvStripped = uInv.replace(/[^A-Z0-9]/g, '');

        return (
          uInv === cleanCode ||
          uName === cleanCode ||
          uPhone === cleanCode ||
          (uInvStripped && uInvStripped === strippedCode)
        );
      });

      if (!targetInviter) {
        // Check cb_staff
        const { data: staffList } = await supabase.from('cb_staff').select('*');
        const matchedStaff = (staffList || []).find(s => {
          const sRef = (s.referral_code || '').trim().toUpperCase();
          const sStaffId = (s.staff_id || '').trim().toUpperCase();
          const sRefStripped = sRef.replace(/[^A-Z0-9]/g, '');
          const sStaffStripped = sStaffId.replace(/[^A-Z0-9]/g, '');

          return (
            sRef === cleanCode ||
            sStaffId === cleanCode ||
            (sRefStripped && sRefStripped === strippedCode) ||
            (sStaffStripped && sStaffStripped === strippedCode)
          );
        });

        if (matchedStaff) {
          // Update user's referred_by_staff_id and member_of_admin_id directly
          const { error: staffUpdateErr } = await supabase
            .from('cb_users')
            .update({
              referred_by_staff_id: matchedStaff.staff_id,
              member_of_admin_id: matchedStaff.created_by_admin_id
            })
            .eq('id', profile.id);

          if (staffUpdateErr) throw staffUpdateErr;

          toast.success(`Successfully linked to staff node: ${matchedStaff.name} (${matchedStaff.staff_id})!`);
          setReferralInput('');
          fetchAffiliateData();
          return;
        }

        toast.error('Invalid referral code. Please verify and try again.');
        return;
      }

      // 2. Clear out self-binding loops or existing bindings
      // Perform database update
      const { error: updateErr } = await supabase
        .from('cb_users')
        .update({
          invited_by_user_id: targetInviter.id
        })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      toast.success(`Successfully linked to referrer: ${targetInviter.username}!`);
      setReferralInput('');
      fetchAffiliateData(); // Refresh page state

    } catch (err) {
      console.error('Error binding referral code:', err);
      toast.error('Failed to bind referral code: ' + err.message);
    } finally {
      setBinding(false);
    }
  };

  // Helper mask username for display: 13912341234 -> 139****1234
  const maskUsername = (name) => {
    if (!name) return '';
    if (name.length <= 4) return name;
    return name.substring(0, 3) + '****' + name.substring(name.length - 4);
  };

  const inviteLink = profile ? `${window.location.origin}/#/register?invite=${profile.invite_code}` : '';

  return (
    <div className="affiliate-page pb-24 flex flex-col min-h-dvh overflow-y-auto bg-slate-50 dark:bg-slate-950">
      {/* Header Bar */}
      <div className="orders-header px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <button className="header-back-btn w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500" onClick={() => navigate('/profile')}>
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span className="orders-title font-black text-lg text-slate-900 dark:text-white">Affiliate Center</span>
        <div className="w-10"></div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 mt-20 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#0071ce]/20 border-t-[#0071ce] rounded-full animate-spin"></div>
          <p className="text-sm font-bold uppercase tracking-widest">Loading dashboard...</p>
        </div>
      ) : (
        <div className="p-6 flex flex-col gap-6">
          
          {/* Main Referral Info Card */}
          <div className="affiliate-card scale-up bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="aff-card-header mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0071ce] text-[10px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-800">
                Affiliate Link
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="aff-info-row flex flex-col gap-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">My Invitation Code</div>
                <div className="aff-info-val-wrap flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-[#0071ce] transition-all" onClick={() => handleCopy(profile?.invite_code, 'Invitation Code')}>
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{profile?.invite_code || '------'}</span>
                  <button className="text-[#0071ce] font-black text-[10px] uppercase tracking-widest">Copy</button>
                </div>
              </div>

              <div className="aff-info-row flex flex-col gap-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Registration Link</div>
                <div className="aff-info-val-wrap flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-[#0071ce] transition-all" onClick={() => handleCopy(inviteLink, 'Referral Link')}>
                  <span className="text-[11px] font-bold text-slate-500 truncate max-w-[70%] font-mono">
                    {inviteLink}
                  </span>
                  <button className="text-[#0071ce] font-black text-[10px] uppercase tracking-widest">Copy</button>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Binding Section */}
          <div className="affiliate-card scale-up bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-7 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="aff-card-header mb-4">
                <span className="text-sm font-black uppercase tracking-widest">Referrer Binding</span>
              </div>

              {inviter ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">Linked Account</div>
                    <div className="text-base font-black text-white mt-1">
                      👤 {maskUsername(inviter.username)}
                    </div>
                  </div>
                  <div className="text-[10px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                    Bound
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBindReferral} className="space-y-4">
                  <p className="text-[11px] font-medium text-white/80 leading-relaxed">
                    Registered without a code? Enter a friend's code below to link accounts permanently.
                  </p>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value)}
                      placeholder="ENTER CODE"
                      className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 h-14 text-white placeholder:text-white/40 font-black tracking-widest outline-none focus:ring-2 focus:ring-white/30 transition-all"
                      maxLength={10}
                      disabled={binding}
                    />
                    <button 
                      type="submit" 
                      className="bg-white text-blue-600 rounded-2xl px-6 h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all disabled:opacity-50"
                      disabled={binding}
                    >
                      {binding ? '...' : 'BIND'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Stats Summary Bento Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-800 scale-up">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Size</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{referredUsers.length}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Active users</div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-slate-800 scale-up">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Commissions</div>
              <div className="text-2xl font-black text-[#0071ce] font-mono leading-none">
                {profile?.commissions ? `$ ${parseFloat(profile.commissions).toFixed(2)}` : '$ 0.00'}
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Total Earned</div>
            </div>
          </div>

          {/* List of Invited Users */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 scale-up flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Downline Members ({referredUsers.length})</span>
            </div>

            {referredUsers.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-200">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight">No referrals yet</div>
                  <div className="text-[11px] font-bold text-slate-400">Share link to start earning!</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {referredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0071ce] to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
                        {user.username.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="text-[13px] font-black text-slate-900 dark:text-white leading-none mb-1">{maskUsername(user.username)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Joined: {new Date(user.reg_time).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/30 text-[#0071ce] px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">{user.level || 'FREE VIP'}</span>
                      <div className="text-[11px] font-black text-emerald-500 font-mono">Bal: ${parseFloat(user.balance).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Styled JSX for Premium Visual Fidelity */}
      <style>{`
        .affiliate-page {
          background-color: var(--bg-main);
          color: var(--text-main);
        }

        .affiliate-card {
          background-color: var(--bg-card);
          border: var(--border-luxury);
          border-radius: 16px;
          padding: 16px;
          box-shadow: var(--shadow-luxury);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .aff-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .aff-card-badge {
          background-color: rgba(0, 113, 206, 0.08);
          color: var(--primary-color);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          border: 1px solid rgba(0, 113, 206, 0.15);
        }

        .aff-card-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .aff-info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .aff-info-lbl {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .aff-info-val-wrap {
          height: 42px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .aff-info-val-wrap:hover {
          border-color: var(--primary-color);
          background-color: rgba(0, 113, 206, 0.02);
        }

        .aff-info-val-text {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
        }

        .aff-copy-btn {
          background: none;
          border: none;
          font-size: 11px;
          font-weight: 700;
          color: var(--primary-color);
          cursor: pointer;
          text-transform: uppercase;
        }

        .aff-bind-input {
          flex: 1;
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          padding: 0 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          background-color: var(--bg-input);
          outline: none;
          transition: all 0.2s;
        }

        .aff-bind-input:focus {
          border-color: var(--primary-color);
          background-color: var(--bg-card);
        }

        .aff-bind-submit {
          height: 42px;
          padding: 0 16px;
          border-radius: 10px;
          background-color: var(--primary-color);
          color: white;
          font-weight: 700;
          font-size: 13px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .aff-bind-submit:hover {
          opacity: 0.95;
          transform: translateY(-0.5px);
        }

        .aff-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .aff-stat-card {
          background-color: var(--bg-card);
          border: var(--border-luxury);
          border-radius: 16px;
          padding: 14px;
          box-shadow: var(--shadow-luxury);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .aff-stat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .aff-stat-number {
          font-size: 18px;
          font-weight: 800;
          color: var(--primary-color);
        }

        .aff-stat-description {
          font-size: 10px;
          color: var(--text-muted);
          line-height: 1.2;
        }

        .aff-users-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 350px;
          overflow-y: auto;
        }

        .aff-user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background-color: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 12px;
        }

        .aff-user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--primary-color) 0%, rgba(0, 113, 206, 0.75) 100%);
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }

        .aff-user-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
        }

        .aff-user-date {
          font-size: 10px;
          color: var(--text-muted);
          marginTop: 2px;
        }

        .aff-user-vip {
          font-size: 10px;
          font-weight: 700;
          background-color: rgba(0, 113, 206, 0.08);
          color: var(--primary-color);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(0, 113, 206, 0.12);
        }

        .aff-user-bal {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-main);
          margin-top: 3px;
        }
      `}</style>
    </div>
  );
}
