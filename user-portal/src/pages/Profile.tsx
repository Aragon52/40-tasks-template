import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

import toast from 'react-hot-toast';
export default function Profile({ balance, username, setUsername, setBalance, setOrders }) {
  const navigate = useNavigate();
  const [clientProfile, setClientProfile] = useState(null);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Banking info state
  const [usdtAddress, setUsdtAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [savingBanking, setSavingBanking] = useState(false);

  // Ref to track modal open state to avoid stale closure overwrites
  const showBankingModalRef = useRef(false);
  useEffect(() => {
    showBankingModalRef.current = showBankingModal;
  }, [showBankingModal]);

  // History states
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeHistoryTab, setActiveHistoryTab] = useState('deposits'); // 'deposits' or 'withdrawals'

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied to clipboard: ${text}`);
  };

  const fetchHistory = async () => {
    if (!username) return;
    try {
      const { data: depData, error: depErr } = await supabase
        .from('cb_deposits')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false });

      const { data: withData, error: withErr } = await supabase
        .from('cb_withdrawals')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false });

      if (!depErr && depData) {
        const mappedDeposits = depData.map(d => ({
          ...d,
          method: d.method || d.currency || 'USDT TRC20'
        }));
        setDeposits(mappedDeposits);
      }
      if (!withErr && withData) {
        const mappedWithdrawals = withData.map(w => ({
          ...w,
          wallet_address: w.wallet_address || w.account_info
        }));
        setWithdrawals(mappedWithdrawals);
      }
    } catch (err) {
      console.error("Error fetching histories:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const syncProfileData = async () => {
    if (!username) return;
    try {
      const { data: users, error } = await supabase
        .from('cb_users')
        .select('*')
        .eq('username', username);
      if (!error && users && users.length > 0) {
        const u = users[0];
        
        // Ensure a unique invitation code is generated if it doesn't exist
        if (!u.invite_code) {
          const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { error: updateErr } = await supabase
            .from('cb_users')
            .update({ invite_code: generatedCode })
            .eq('id', u.id);
          if (!updateErr) {
            u.invite_code = generatedCode;
          }
        }

        setClientProfile(u);
        // Sync banking fields only if the user is not currently editing them in the modal
        if (!showBankingModalRef.current) {
          setUsdtAddress(u.usdt_address || '');
          setBankName(u.bank_name || '');
          setBankAccount(u.bank_account || '');
          setBankHolder(u.bank_holder || '');
        }
      }
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  };

  useEffect(() => {
    syncProfileData();
    fetchHistory();
    const interval = setInterval(() => {
      if (document.hidden) return; // Save bandwidth when tab is in background!
      syncProfileData();
      fetchHistory();
    }, 20000); // Poll every 20 seconds instead of 2 seconds
    return () => clearInterval(interval);
  }, [username]);

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const executeSignOut = async () => {
    try {
      if (username) {
        await supabase.from('cb_users').update({ online: 'Offline' }).eq('username', username);
      }
    } catch (err) {
      console.error('Error setting status to Offline:', err);
    }
    localStorage.removeItem('cb_user_session');
    localStorage.removeItem('cb_username');
    localStorage.removeItem('cb_balance');
    localStorage.removeItem('cb_orders');
    window.dispatchEvent(new Event('cb_session_updated'));
    setShowSignOutConfirm(false);
    navigate('/login');
  };

  const handleEndSession = () => {
    setShowResetConfirm(true);
  };

  const executeEndSession = async () => {
    try {
      if (username) {
        await supabase.from('cb_users').update({ online: 'Offline' }).eq('username', username);
      }
    } catch (err) {}
    localStorage.clear();
    setShowResetConfirm(false);
    toast("All sessions and hierarchy states have been reset!");
    window.location.reload();
  };

  const handleSaveBankingInfo = async () => {
    if (!clientProfile) return;
    setSavingBanking(true);
    try {
      const { error } = await supabase
        .from('cb_users')
        .update({
          usdt_address: usdtAddress.trim(),
          bank_name: bankName.trim(),
          bank_account: bankAccount.trim(),
          bank_holder: bankHolder.trim()
        })
        .eq('id', clientProfile.id);

      if (error) {
        toast.error('Error saving banking info: ' + error.message);
        return;
      }
      toast.success('Banking & payment info saved successfully!');
      setShowBankingModal(false);
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSavingBanking(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !clientProfile) {
        return;
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      setUploading(true);

      const { error: uploadError } = await supabase.storage
        .from('cb_storage')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('cb_storage')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('cb_users')
        .update({ profile_photo: avatarUrl })
        .eq('id', clientProfile.id);

      if (updateError) throw updateError;

      setClientProfile(prev => ({ ...prev, profile_photo: avatarUrl }));
      toast.success('Profile photo updated successfully!');
    } catch (error) {
      toast.error('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Determine display UID
  // First user 'Juxev' displays ID-24031
  const displayUid = (username.toLowerCase() === 'juxev') ? 'ID-24031' : (clientProfile?.id || 'ID-24031');
  const promoCode = clientProfile?.invite_code || 'OZ5NLS';

  const menuItems = [
    { 
      label: 'Deposit Funds', 
      path: '/deposit', 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M6 14h.01M10 14h.01"/></svg> 
    },
    { 
      label: 'Request Payout', 
      path: '/withdraw', 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg> 
    },
    { 
      label: 'Support Inbox', 
      path: '/support', 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 
    },
    { 
      label: 'Affiliate Stats', 
      path: '/affiliate', 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg> 
    },
    { 
      label: 'Deposit History', 
      path: '/deposit-history', 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> 
    },
    { 
      label: 'Payout History', 
      path: '/payout-history', 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> 
    },
    { 
      label: 'Transaction Logs', 
      path: '/transaction-logs', 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> 
    },
    { 
      label: 'Banking & Payment Info', 
      action: () => setShowBankingModal(true), 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> 
    },
    { 
      label: 'Install Walmart App', 
      action: () => {
        localStorage.removeItem('cb_pwa_dismissed');
        window.dispatchEvent(new Event('pwa-force-show-prompt'));
      }, 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 
    },
    { 
      label: 'Security Settings', 
      path: '/security', 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> 
    },
    { 
      label: 'Rules & Policies', 
      action: () => setShowPoliciesModal(true), 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5L4 4.9A2.5 2.5 0 0 1 6.5 2.4H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/></svg>
    },
    { 
      label: 'Terms & Conditions', 
      action: () => setShowTermsModal(true), 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    },
    { 
      label: 'Reset All Data', 
      action: handleEndSession, 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg> 
    },
    { 
      label: 'Sign Out Account', 
      action: handleSignOut, 
      icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>, 
      isDanger: true 
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 pt-6 pb-32 max-w-md mx-auto space-y-5 scale-up">
        {/* Profile Header */}
        <div className="profile-header-card rounded-2xl">
          <div className="user-info-section">
            <div 
              className="user-avatar-large" 
              style={{ backgroundColor: 'var(--bg-input)', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {uploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12 }}>
                  ...
                </div>
              )}
              {clientProfile?.profile_photo ? (
                <img src={clientProfile.profile_photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleAvatarUpload} 
            />
            
            <div className="user-credentials">
              <div className="user-name-row">
                <span className="profile-username" id="profile-lbl-username">{username}</span>
              </div>
              <div className="credential-row" onClick={() => handleCopy(displayUid, 'UID')}>
                <span className="credential-text">UID: {displayUid}</span>
                <button className="copy-btn">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
              <div className="credential-row" onClick={() => handleCopy(promoCode, 'Invitation Code')}>
                <span className="credential-text">Invitation Code: {promoCode}</span>
                <button className="copy-btn">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
              <div className="rating-row">
                <span className="rating-label">Credit Rating:</span>
                <span className="rating-value">100</span>
              </div>

            </div>
          </div>

          {/* Asset statistics values row */}
          <div className="assets-report-row">
            <div className="asset-col">
              <span className="asset-val">$ {parseFloat(balance).toFixed(2)}</span>
              <span className="asset-lbl">Total Net Assets</span>
            </div>
            <div className="asset-col">
              <span className="asset-val">$ {clientProfile && clientProfile.earnings !== undefined && clientProfile.earnings !== null ? parseFloat(clientProfile.earnings).toFixed(2) : '0.00'}</span>
              <span className="asset-lbl">Lifetime Earnings</span>
            </div>
            <div className="asset-col">
              <span className="asset-val">$ {clientProfile && clientProfile.frozen !== undefined && clientProfile.frozen !== null ? parseFloat(clientProfile.frozen).toFixed(2) : '0.00'}</span>
              <span className="asset-lbl">Reserved Balance</span>
            </div>
          </div>
        </div>

        {/* Responsive Grid Layout */}
        <div className="profile-grid-layout">
          <div className="profile-left-col">
            {/* Menu list section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`w-full px-5 py-4 flex items-center justify-between text-sm font-medium ${item.isDanger ? 'text-rose-600' : 'text-slate-700'} hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors text-left`}
                  onClick={item.action ? item.action : () => navigate(item.path)}
                  id={`btn-menu-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={item.isDanger ? 'text-rose-500' : 'text-blue-600'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <div className="text-slate-400">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="profile-right-col">
            {/* Dynamic History Section (Deposits & Withdrawals) */}
            <div className="profile-history-section" style={{ padding: '0 16px 24px 16px' }}>
              <div className="history-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Transaction History Records
                </h3>
              </div>
              
              <div className="history-tab-switcher" style={{ display: 'flex', gap: '8px', marginBottom: '12px', background: 'var(--bg-input)', padding: '4px', borderRadius: '8px' }}>
                <button 
                  className={`history-tab-btn ${activeHistoryTab === 'deposits' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('deposits')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeHistoryTab === 'deposits' ? 'var(--primary-gradient)' : 'transparent',
                    color: activeHistoryTab === 'deposits' ? 'white' : 'var(--text-muted)'
                  }}
                >
                  📥 Deposits ({deposits.length})
                </button>
                <button 
                  className={`history-tab-btn ${activeHistoryTab === 'withdrawals' ? 'active' : ''}`}
                  onClick={() => setActiveHistoryTab('withdrawals')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeHistoryTab === 'withdrawals' ? 'var(--primary-gradient)' : 'transparent',
                    color: activeHistoryTab === 'withdrawals' ? 'white' : 'var(--text-muted)'
                  }}
                >
                  📤 Withdrawals ({withdrawals.length})
                </button>
              </div>

              <div className="history-records-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loadingHistory ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>Loading transaction records...</div>
                ) : activeHistoryTab === 'deposits' ? (
                  deposits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: 'var(--border-glass)', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      No deposit records found.
                    </div>
                  ) : (
                    deposits.map(dep => {
                      const statusLower = (dep.status || 'pending').toLowerCase();
                      let statusLabel = dep.status || 'Pending';
                      if (statusLower === 'approved') statusLabel = 'Finished';
                      const badgeClass = statusLower === 'approved' ? 'badge-success' : statusLower === 'rejected' ? 'badge-danger' : 'badge-pending';
                      
                      return (
                        <div className="history-item-card" key={dep.id} style={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          border: 'var(--border-glass)',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-light)', fontFamily: 'var(--font-secondary)' }}>
                              {new Date(dep.created_at || dep.timestamp).toLocaleString()}
                            </span>
                            <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', padding: '2px 8px' }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                                Deposit Request
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                                {dep.method || 'USDT TRC20'} {dep.transaction_hash ? `(${dep.transaction_hash})` : ''}
                              </div>
                            </div>
                            <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--success-color)' }}>
                              +${parseFloat(dep.amount || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  withdrawals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: 'var(--border-glass)', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      No withdrawal records found.
                    </div>
                  ) : (
                    withdrawals.map(wth => {
                      const statusLower = (wth.status || 'pending').toLowerCase();
                      let statusLabel = wth.status || 'Pending';
                      if (statusLower === 'approved') statusLabel = 'Finished';
                      const badgeClass = statusLower === 'approved' ? 'badge-success' : statusLower === 'rejected' ? 'badge-danger' : 'badge-pending';

                      return (
                        <div className="history-item-card" key={wth.id} style={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          border: 'var(--border-glass)',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-light)', fontFamily: 'var(--font-secondary)' }}>
                              {new Date(wth.created_at || wth.timestamp).toLocaleString()}
                            </span>
                            <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', padding: '2px 8px' }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                                Withdrawal Request
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                                {wth.method || 'USDT TRC20'} {wth.wallet_address ? `(${wth.wallet_address})` : ''}
                              </div>
                            </div>
                            <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                              -${parseFloat(wth.amount || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Policies Modal */}
      {showPoliciesModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content scale-up">
            <div className="profile-modal-header">
              <h3>Rules & Operational Policies</h3>
              <button className="profile-modal-close" onClick={() => setShowPoliciesModal(false)}>✕</button>
            </div>
            <div className="profile-modal-body">
              <h4>1. Retail Matching Operational Model</h4>
              <p>Walmart utilizes a real-time smart matching algorithm to connect merchants and retail nodes. Users must maintain a positive wallet balance to match and accept retail allocation worksheets.</p>
              
              <h4>2. Commission & Earnings Yields</h4>
              <p>Commissions are credited immediately upon successful verification and submission of each matched order. The standard commission yield is calculated based on the assigned VIP tier level rates.</p>

              <h4>3. Wallet Balance & Escrow Hold</h4>
              <p>During the active matching progression, the cost of matched orders will be temporarily held in escrow. Once you submit the order, the held principal and the earned commission are returned immediately to your active wallet balance.</p>

              <h4>4. Matching Daily Limits</h4>
              <p>Each user account is allocated a maximum of 10 standard matches per calendar day. VIP upgrades can raise matching limits, speed up settlement rates, and increase profit margins.</p>

              <h4>5. Financial Safety Policies</h4>
              <p>To prevent multi-accounting, automated script exploits, or capital washing, active balances are audited prior to withdrawal approval. Withdrawal requests are processed within 1 to 24 hours.</p>
            </div>
            <div className="profile-modal-footer">
              <button className="profile-modal-btn" onClick={() => setShowPoliciesModal(false)}>I Understand</button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content scale-up">
            <div className="profile-modal-header">
              <h3>Terms of Service Agreement</h3>
              <button className="profile-modal-close" onClick={() => setShowTermsModal(false)}>✕</button>
            </div>
            <div className="profile-modal-body">
              <h4>1. Agreement of Service</h4>
              <p>By registering an account with Walmart, you represent that you are at least 18 years of age and agree to comply with all operational terms, verification checks, and administrative bindings.</p>
              
              <h4>2. User Responsibilities</h4>
              <p>Users are responsible for maintaining the confidentiality of their passwords and secure keys. Sharing accounts, transferring balances to other clients without approval, or registering multiple accounts under staff nodes is strictly prohibited.</p>

              <h4>3. Limitation of Liability</h4>
              <p>Walmart operates as a smart retail intermediary. Under no circumstances shall the platform, its admins, or operational staff nodes be liable for indirect, incidental, or consequential losses arising from network latency or client connectivity issues.</p>

              <h4>4. Node Suspensions</h4>
              <p>We reserve the right to suspend or lock accounts that violate system policies, manipulate transaction slips, or engage in suspicious activity. Suspended users must contact their affiliated support agent for audit resolution.</p>

              <h4>5. Amendments to Terms</h4>
              <p>Walmart reserves the right to modify or update these terms at any time. Continued use of the matching portal following adjustments constitutes acceptance of the new terms.</p>
            </div>
            <div className="profile-modal-footer">
              <button className="profile-modal-btn" onClick={() => setShowTermsModal(false)}>Accept Terms</button>
            </div>
          </div>
        </div>
      )}

      {/* Banking & Payment Info Modal */}
      {showBankingModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content scale-up">
            <div className="profile-modal-header">
              <h3>💳 Banking & Payment Info</h3>
              <button className="profile-modal-close" onClick={() => setShowBankingModal(false)}>✕</button>
            </div>
            <div className="profile-modal-body" style={{ gap: 16 }}>
              <p style={{ fontSize: 11, background: 'rgba(0,113,206,0.06)', border: '1px solid rgba(0,113,206,0.15)', borderRadius: 6, padding: '10px 12px', color: 'var(--primary-color)' }}>
                ℹ️ These details are used by default when you submit a withdrawal request. Keep them accurate.
              </p>

              <div className="banking-field-group">
                <label className="banking-field-label">USDT Wallet Address (TRC20 / ERC20)</label>
                <input
                  type="text"
                  className="banking-field-input"
                  placeholder="e.g. TY3N9dSk8sHDKsi8..."
                  value={usdtAddress}
                  onChange={e => setUsdtAddress(e.target.value)}
                  id="input-usdt-address"
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 12, marginTop: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bank Account Details</p>
                <div className="banking-field-group">
                  <label className="banking-field-label">Bank Name</label>
                  <input
                    type="text"
                    className="banking-field-input"
                    placeholder="e.g. Bank of America"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    id="input-bank-name"
                  />
                </div>
                <div className="banking-field-group">
                  <label className="banking-field-label">Account Number / IBAN</label>
                  <input
                    type="text"
                    className="banking-field-input"
                    placeholder="e.g. 1234567890"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    id="input-bank-account"
                  />
                </div>
                <div className="banking-field-group">
                  <label className="banking-field-label">Account Holder Name</label>
                  <input
                    type="text"
                    className="banking-field-input"
                    placeholder="e.g. John Smith"
                    value={bankHolder}
                    onChange={e => setBankHolder(e.target.value)}
                    id="input-bank-holder"
                  />
                </div>
              </div>
            </div>
            <div className="profile-modal-footer">
              <button className="profile-modal-btn" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', marginRight: 8 }} onClick={() => setShowBankingModal(false)}>Cancel</button>
              <button className="profile-modal-btn" onClick={handleSaveBankingInfo} disabled={savingBanking} id="btn-save-banking">
                {savingBanking ? 'Saving...' : '💾 Save Info'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content scale-up" style={{ maxWidth: '400px' }}>
            <div className="profile-modal-header">
              <h3>🚪 Sign Out Account</h3>
              <button className="profile-modal-close" onClick={() => setShowSignOutConfirm(false)}>✕</button>
            </div>
            <div className="profile-modal-body" style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)', marginBottom: '8px' }}>
                Are you sure you want to sign out?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                You will need to enter your credentials to log back in to your merchant panel.
              </p>
            </div>
            <div className="profile-modal-footer" style={{ gap: '10px' }}>
              <button 
                className="profile-modal-btn" 
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', marginRight: '8px' }} 
                onClick={() => setShowSignOutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="profile-modal-btn" 
                style={{ background: '#ef4444', color: 'white' }} 
                onClick={executeSignOut}
                id="btn-confirm-signout"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Platform Data Confirmation Modal */}
      {showResetConfirm && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content scale-up" style={{ maxWidth: '400px' }}>
            <div className="profile-modal-header">
              <h3>⚠️ Reset Platform Data</h3>
              <button className="profile-modal-close" onClick={() => setShowResetConfirm(false)}>✕</button>
            </div>
            <div className="profile-modal-body" style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '14.5px', fontWeight: '600', color: '#ef4444', marginBottom: '8px' }}>
                Warning: Irreversible Action
              </p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-main)', marginBottom: '6px' }}>
                Are you sure you want to reset all platform data to initial defaults?
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                This is a developer convenience option that will completely clear your local storage sessions.
              </p>
            </div>
            <div className="profile-modal-footer" style={{ gap: '10px' }}>
              <button 
                className="profile-modal-btn" 
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', marginRight: '8px' }} 
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="profile-modal-btn" 
                style={{ background: '#ef4444', color: 'white' }} 
                onClick={executeEndSession}
                id="btn-confirm-reset"
              >
                Reset All Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-page {
          display: flex;
          flex-direction: column;
          background-color: var(--bg-app);
        }

        .profile-grid-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .profile-grid-layout {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
          }
        }

        .profile-header-card {
          background: var(--primary-gradient);
          color: white;
          padding: 24px 20px 20px 20px;
          border-bottom-left-radius: var(--border-radius-lg);
          border-bottom-right-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .user-info-section {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .user-avatar-large {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background-color: var(--bg-input);
          border: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }

        .user-credentials {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .profile-username {
          font-size: 20px;
          font-weight: 700;
        }

        .credential-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          opacity: 0.9;
          cursor: pointer;
        }

        .credential-row:hover {
          opacity: 1;
        }

        .copy-btn {
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          opacity: 0.9;
          margin-top: 2px;
        }

        .rating-value {
          font-weight: 700;
          background-color: rgba(255, 255, 255, 0.08);
          border: var(--border-glass);
          padding: 1px 6px;
          border-radius: 4px;
        }

        /* Asset statistics row styles */
        .assets-report-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background-color: rgba(0,0,0,0.1);
          border-radius: var(--border-radius-md);
          padding: 16px 8px;
          text-align: center;
        }

        .asset-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .asset-col:not(:last-child) {
          border-right: 1px solid rgba(255, 255, 255, 0.15);
        }

        .asset-val {
          font-size: 16px;
          font-weight: 700;
        }

        .asset-lbl {
          font-size: 9px;
          opacity: 0.8;
          text-transform: uppercase;
        }

        /* Menu list items styles */
        .profile-menu-container {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .menu-item {
          background-color: var(--bg-card);
          border-radius: var(--border-radius-md);
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: var(--transition-fast);
          border: var(--border-glass);
        }

        .menu-item:active {
          transform: translateY(1px);
          background-color: var(--bg-input);
        }

        .menu-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .menu-icon {
          display: flex;
          align-items: center;
          color: var(--primary-color);
        }

        .menu-label {
          font-size: 13px;
          font-weight: 550;
          color: var(--text-main);
        }

        .menu-item-right {
          color: var(--text-light);
        }

        .danger-item {
          border-left: 3px solid var(--danger-color);
        }

        .danger-item .menu-label {
          color: var(--danger-color);
        }

        /* Premium Modal Overlays */
        .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .profile-modal-content {
          background-color: var(--bg-card);
          border: var(--border-luxury);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          width: 90%;
          max-width: 480px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .profile-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: var(--border-glass);
          background-color: rgba(255, 255, 255, 0.02);
        }

        .profile-modal-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
        }

        .profile-modal-close {
          background: none;
          border: none;
          color: var(--text-light);
          font-size: 16px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .profile-modal-close:hover {
          color: var(--primary-color);
        }

        .profile-modal-body {
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--text-muted);
          text-align: left;
        }

        .profile-modal-body h4 {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
          margin: 4px 0 2px 0;
          display: flex;
          align-items: center;
        }

        .profile-modal-body p {
          margin: 0 0 8px 0;
        }

        .profile-modal-footer {
          padding: 16px 20px;
          border-top: var(--border-glass);
          display: flex;
          justify-content: flex-end;
          background-color: rgba(255, 255, 255, 0.02);
        }

        .profile-modal-btn {
          height: 38px;
          padding: 0 20px;
          border-radius: 6px;
          background: var(--primary-gradient);
          color: white;
          font-weight: 600;
          font-size: 12px;
          border: none;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .profile-modal-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .profile-modal-btn:active {
          transform: translateY(0);
        }

        @keyframes modalSlideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .banking-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }

        .banking-field-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .banking-field-input {
          width: 100%;
          height: 40px;
          border-radius: 6px;
          border: 1px solid rgba(0, 113, 206, 0.2);
          padding: 0 12px;
          font-size: 13px;
          background-color: var(--bg-input);
          color: var(--text-main);
          outline: none;
          transition: border-color 0.2s;
        }

        .banking-field-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(0, 113, 206, 0.08);
        }

        .badge-danger {
          background-color: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.15);
          color: var(--danger-color);
        }
      `}</style>
    </>
  );
}
