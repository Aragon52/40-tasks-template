import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import LanguageSwitcher from '../components/LanguageSwitcher';
import loginBg from '@/login.png';
import { 
  User, 
  Phone, 
  Lock, 
  ShieldCheck, 
  Key, 
  Ticket, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  Search,
  Globe,
  Info
} from 'lucide-react';
import { Button, Modal, Input } from '@/src/shared/UI';
import toast from 'react-hot-toast';

const COUNTRIES = [
  { code: '+213', flagCode: 'dz', name: 'Algeria' },
  { code: '+54', flagCode: 'ar', name: 'Argentina' },
  { code: '+61', flagCode: 'au', name: 'Australia' },
  { code: '+43', flagCode: 'at', name: 'Austria' },
  { code: '+973', flagCode: 'bh', name: 'Bahrain' },
  { code: '+880', flagCode: 'bd', name: 'Bangladesh' },
  { code: '+32', flagCode: 'be', name: 'Belgium' },
  { code: '+591', flagCode: 'bo', name: 'Bolivia' },
  { code: '+55', flagCode: 'br', name: 'Brazil' },
  { code: '+673', flagCode: 'bn', name: 'Brunei' },
  { code: '+855', flagCode: 'kh', name: 'Cambodia' },
  { code: '+56', flagCode: 'cl', name: 'Chile' },
  { code: '+86', flagCode: 'cn', name: 'China' },
  { code: '+57', flagCode: 'co', name: 'Colombia' },
  { code: '+53', flagCode: 'cu', name: 'Cuba' },
  { code: '+420', flagCode: 'cz', name: 'Czech Republic' },
  { code: '+45', flagCode: 'dk', name: 'Denmark' },
  { code: '+1', flagCode: 'do', name: 'Dominican Republic' },
  { code: '+593', flagCode: 'ec', name: 'Ecuador' },
  { code: '+20', flagCode: 'eg', name: 'Egypt' },
  { code: '+358', flagCode: 'fi', name: 'Finland' },
  { code: '+33', flagCode: 'fr', name: 'France' },
  { code: '+49', flagCode: 'de', name: 'Germany' },
  { code: '+30', flagCode: 'gr', name: 'Greece' },
  { code: '+502', flagCode: 'gt', name: 'Guatemala' },
  { code: '+504', flagCode: 'hn', name: 'Honduras' },
  { code: '+852', flagCode: 'hk', name: 'Hong Kong' },
  { code: '+36', flagCode: 'hu', name: 'Hungary' },
  { code: '+91', flagCode: 'in', name: 'India' },
  { code: '+62', flagCode: 'id', name: 'Indonesia' },
  { code: '+964', flagCode: 'iq', name: 'Iraq' },
  { code: '+353', flagCode: 'ie', name: 'Ireland' },
  { code: '+972', flagCode: 'il', name: 'Israel' },
  { code: '+39', flagCode: 'it', name: 'Italy' },
  { code: '+81', flagCode: 'jp', name: 'Japan' },
  { code: '+7', flagCode: 'kz', name: 'Kazakhstan' },
  { code: '+254', flagCode: 'ke', name: 'Kenya' },
  { code: '+82', flagCode: 'kr', name: 'Korea' },
  { code: '+965', flagCode: 'kw', name: 'Kuwait' },
  { code: '+856', flagCode: 'la', name: 'Laos' },
  { code: '+853', flagCode: 'mo', name: 'Macao' },
  { code: '+60', flagCode: 'my', name: 'Malaysia' },
  { code: '+52', flagCode: 'mx', name: 'Mexico' },
  { code: '+212', flagCode: 'ma', name: 'Morocco' },
  { code: '+95', flagCode: 'mm', name: 'Myanmar' },
  { code: '+977', flagCode: 'np', name: 'Nepal' },
  { code: '+31', flagCode: 'nl', name: 'Netherlands' },
  { code: '+64', flagCode: 'nz', name: 'New Zealand' },
  { code: '+505', flagCode: 'ni', name: 'Nicaragua' },
  { code: '+234', flagCode: 'ng', name: 'Nigeria' },
  { code: '+47', flagCode: 'no', name: 'Norway' },
  { code: '+968', flagCode: 'om', name: 'Oman' },
  { code: '+92', flagCode: 'pk', name: 'Pakistan' },
  { code: '+507', flagCode: 'pa', name: 'Panama' },
  { code: '+595', flagCode: 'py', name: 'Paraguay' },
  { code: '+51', flagCode: 'pe', name: 'Peru' },
  { code: '+63', flagCode: 'ph', name: 'Philippines' },
  { code: '+48', flagCode: 'pl', name: 'Poland' },
  { code: '+351', flagCode: 'pt', name: 'Portugal' },
  { code: '+974', flagCode: 'qa', name: 'Qatar' },
  { code: '+40', flagCode: 'ro', name: 'Romania' },
  { code: '+7', flagCode: 'ru', name: 'Russia' },
  { code: '+966', flagCode: 'sa', name: 'Saudi Arabia' },
  { code: '+65', flagCode: 'sg', name: 'Singapore' },
  { code: '+421', flagCode: 'sk', name: 'Slovakia' },
  { code: '+27', flagCode: 'za', name: 'South Africa' },
  { code: '+34', flagCode: 'es', name: 'Spain' },
  { code: '+94', flagCode: 'lk', name: 'Sri Lanka' },
  { code: '+46', flagCode: 'se', name: 'Sweden' },
  { code: '+41', flagCode: 'ch', name: 'Switzerland' },
  { code: '+886', flagCode: 'tw', name: 'Taiwan' },
  { code: '+66', flagCode: 'th', name: 'Thailand' },
  { code: '+216', flagCode: 'tn', name: 'Tunisia' },
  { code: '+90', flagCode: 'tr', name: 'Turkey' },
  { code: '+971', flagCode: 'ae', name: 'UAE' },
  { code: '+44', flagCode: 'gb', name: 'UK' },
  { code: '+380', flagCode: 'ua', name: 'Ukraine' },
  { code: '+598', flagCode: 'uy', name: 'Uruguay' },
  { code: '+1', flagCode: 'us', name: 'USA/Canada' },
  { code: '+998', flagCode: 'uz', name: 'Uzbekistan' },
  { code: '+58', flagCode: 've', name: 'Venezuela' },
  { code: '+84', flagCode: 'vn', name: 'Vietnam' }
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Country selector
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === '+1' && c.flagCode === 'us') || COUNTRIES[0]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearchQuery.toLowerCase().trim()) || 
    c.code.includes(countrySearchQuery.trim())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCountryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('invite');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !phone || !password || !confirmPassword || !referralCode || !withdrawPassword) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!termsAgreed) {
      toast.error('You must agree to terms');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const rawInput = referralCode.trim();
      const codeInput = rawInput.toUpperCase();
      const strippedInput = codeInput.replace(/[^A-Z0-9]/g, '');

      let matchingStaff: any = null;
      let inviterUser: any = null;

      // 1. Fetch cb_staff records to match referral_code or staff_id
      const { data: staffList } = await supabase
        .from('cb_staff')
        .select('*');

      if (staffList && staffList.length > 0) {
        matchingStaff = staffList.find(s => {
          const sRef = (s.referral_code || '').trim().toUpperCase();
          const sStaffId = (s.staff_id || '').trim().toUpperCase();
          const sRefStripped = sRef.replace(/[^A-Z0-9]/g, '');
          const sStaffStripped = sStaffId.replace(/[^A-Z0-9]/g, '');

          return (
            sRef === codeInput ||
            sStaffId === codeInput ||
            (sRefStripped && sRefStripped === strippedInput) ||
            (sStaffStripped && sStaffStripped === strippedInput) ||
            sRef.includes(codeInput) ||
            sStaffId.includes(codeInput)
          );
        });
      }

      // 2. If not matched on staff directly, check cb_users (invite_code, username, phone)
      if (!matchingStaff) {
        const { data: userList } = await supabase
          .from('cb_users')
          .select('id, username, phone, invite_code, referred_by_staff_id, member_of_admin_id');

        if (userList && userList.length > 0) {
          inviterUser = userList.find(u => {
            const uInv = (u.invite_code || '').trim().toUpperCase();
            const uName = (u.username || '').trim().toUpperCase();
            const uPhone = (u.phone || '').trim().toUpperCase();
            const uInvStripped = uInv.replace(/[^A-Z0-9]/g, '');

            return (
              uInv === codeInput ||
              uName === codeInput ||
              uPhone === codeInput ||
              (uInvStripped && uInvStripped === strippedInput) ||
              uInv.includes(codeInput)
            );
          });
        }

        if (inviterUser) {
          if (staffList && staffList.length > 0 && inviterUser.referred_by_staff_id) {
            matchingStaff = staffList.find(s => (s.staff_id || '').toUpperCase() === inviterUser.referred_by_staff_id.toUpperCase());
          }
          if (!matchingStaff) {
            matchingStaff = {
              staff_id: inviterUser.referred_by_staff_id || 'AD02SI1',
              name: inviterUser.username || 'System Inviter',
              status: 'Active',
              created_by_admin_id: inviterUser.member_of_admin_id || 'AD02'
            };
          }
        }
      }

      // 3. Check cb_admins table (account_id, name, email)
      if (!matchingStaff) {
        const { data: adminList } = await supabase
          .from('cb_admins')
          .select('id, account_id, name, email');

        const matchedAdmin = (adminList || []).find(a => {
          const accId = (a.account_id || '').trim().toUpperCase();
          const aName = (a.name || '').trim().toUpperCase();
          return accId === codeInput || aName === codeInput || accId.includes(codeInput);
        });

        if (matchedAdmin) {
          if (staffList && staffList.length > 0) {
            matchingStaff = staffList.find(s => (s.created_by_admin_id || '').toUpperCase() === matchedAdmin.account_id.toUpperCase());
          }
          if (!matchingStaff) {
            matchingStaff = {
              staff_id: `${matchedAdmin.account_id}SI1`,
              name: matchedAdmin.name || matchedAdmin.account_id,
              status: 'Active',
              created_by_admin_id: matchedAdmin.account_id
            };
          }
        }
      }

      // 4. Default / Generic fallback for system or generic terms
      if (!matchingStaff && !inviterUser) {
        const defaultTerms = ['DEFAULT', 'WALLMARK', 'WALMARK', 'WALMART', 'PROMO', 'VIP', 'ROOT', 'SYSTEM', 'INVITE', 'REGISTER'];
        const isDefaultAttempt = defaultTerms.some(term => codeInput.includes(term)) || codeInput.startsWith('AD') || codeInput.length >= 3;

        if (isDefaultAttempt && staffList && staffList.length > 0) {
          matchingStaff = staffList.find(s => s.status === 'Active') || staffList[0];
        }
      }

      if (!matchingStaff && !inviterUser) {
        toast.error('Invalid Invitation Code');
        setIsLoading(false);
        return;
      }

      if (matchingStaff?.status && matchingStaff.status !== 'Active') {
        toast.error('Suspended invitation code');
        setIsLoading(false);
        return;
      }

      const rawDigits = phone.trim().replace(/^[+]/, '');
      const finalPhoneCombined = `${selectedCountry.code}${rawDigits}`;
      const computedUsername = username.trim();
      const computedEmail = `${finalPhoneCombined}@merchant.walmark.com`;

      const { data: existingUsers } = await supabase
        .from('cb_users')
        .select('username, phone')
        .or(`username.eq.${computedUsername},phone.eq.${finalPhoneCombined}`);

      if (existingUsers && existingUsers.length > 0) {
        toast.error('Username or Phone already registered');
        setIsLoading(false);
        return;
      }

      const newUserId = 'ID-' + Math.floor(10000 + Math.random() * 90000);
      const parentAdminId = matchingStaff.created_by_admin_id || 'OWNER';
      
      const generateRandomCode = (len: number) => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let res = '';
        for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
        return res;
      };
      
      const inviteCode = `WK${generateRandomCode(8)}${parentAdminId}`;

      const newUser = {
        id: newUserId,
        username: computedUsername,
        email: computedEmail,
        phone: finalPhoneCombined,
        nickname: computedUsername,
        level: 'FREE VIP',
        rate: '$/1.0000',
        acceptance: 'Allowed',
        online: 'Online',
        balance: 0.00,
        frozen: 0.00,
        topup: 0.00,
        spent_today: 0.00,
        spent_current: 0.00,
        remaining: 10,
        withdraw: 'Enabled',
        tp_recharge: 0.00,
        be_recharge: 0.00,
        earnings: 0.00,
        commissions: 0.00,
        withdrawals: 0.00,
        invite_code: inviteCode,
        subs: 0,
        inviter: `${matchingStaff.name} (${matchingStaff.staff_id})`,
        referred_by_staff_id: matchingStaff.staff_id,
        member_of_admin_id: matchingStaff.created_by_admin_id,
        referral_id: codeInput,
        invited_by_user_id: inviterUser ? inviterUser.id : '',
        l1_agent: matchingStaff.name,
        l2_agent: matchingStaff.created_by_admin_id,
        ip: '192.168.1.' + Math.floor(Math.random() * 254),
        reg_time: new Date().toISOString(),
        password: password,
        password_plain: password,
        withdraw_password: withdrawPassword
      };

      const { error: insertError } = await supabase.from('cb_users').insert([newUser]);
      if (insertError) throw insertError;

      localStorage.setItem('cb_username', computedUsername);
      localStorage.setItem('cb_balance', '0.00');
      localStorage.setItem('cb_user_session', JSON.stringify({
        id: newUserId,
        username: computedUsername,
        referredBy: matchingStaff.staff_id
      }));
      window.dispatchEvent(new Event('cb_session_updated'));

      toast.success('Merchant account activated');
      navigate('/home');
    } catch (err: any) {
      toast.error('Registration failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={loginBg} alt="bg" className="w-full h-full object-cover opacity-30 scale-110 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-indigo-950/40" />
      </div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      {/* Language Corner */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-xl text-white">
        <Globe className="w-4 h-4 text-sky-400 shrink-0" />
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-lg my-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="glass-dark border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center space-y-4 mb-10 pt-4 sm:pt-0">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/15">
              <span className="font-extrabold text-xl text-sky-400 tracking-tight italic">Walmart</span>
              <span className="flex items-center">
                <svg viewBox="0 0 100 100" width="18" height="18" className="shrink-0">
                  <g transform="translate(50,50)" stroke="#FFC220" strokeWidth="15" strokeLinecap="round">
                    <line x1="0" y1="-10" x2="0" y2="-38" />
                    <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(60)" />
                    <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(120)" />
                    <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(180)" />
                    <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(240)" />
                    <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(300)" />
                  </g>
                </svg>
              </span>
              <div className="w-px h-5 bg-white/20 ml-1" />
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Merchant Onboarding</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Activate your global matching node</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <User className="w-3 h-3" />
                Merchant Identity
              </label>
              <Input 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Choose merchant username"
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Phone */}
            <div className={`space-y-2 relative ${countryDropdownOpen ? 'z-50' : 'z-10'}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Phone className="w-3 h-3" />
                Mobile Connection
              </label>
              <div className="flex h-14 bg-white/5 border border-white/10 rounded-2xl relative focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
                <div className="relative shrink-0 h-full" ref={countryDropdownRef}>
                  <button 
                    type="button"
                    onClick={() => setCountryDropdownOpen(prev => !prev)}
                    aria-expanded={countryDropdownOpen}
                    className="h-full px-3.5 flex items-center gap-2 bg-white/5 border-r border-white/10 hover:bg-white/10 active:bg-white/15 transition-colors rounded-l-2xl cursor-pointer"
                  >
                    <img 
                      src={`https://flagcdn.com/w40/${selectedCountry.flagCode}.png`} 
                      className="w-5 h-3.5 object-cover rounded-sm shadow-sm shrink-0" 
                      alt="" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-sm font-black text-white">{selectedCountry.code}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${countryDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
                  </button>

                  {countryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-slate-900/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[100] ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2.5 border-b border-white/10 flex items-center gap-2 bg-white/5">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Search countries or code..." 
                          className="bg-transparent border-none text-sm text-white placeholder-slate-400 w-full outline-none py-1"
                          value={countrySearchQuery}
                          onChange={e => setCountrySearchQuery(e.target.value)}
                        />
                        {countrySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCountrySearchQuery('')}
                            className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar overscroll-contain">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map(c => {
                            const isSelected = selectedCountry.code === c.code && selectedCountry.flagCode === c.flagCode;
                            return (
                              <button
                                key={`${c.flagCode}-${c.code}`}
                                type="button"
                                onClick={() => { 
                                  setSelectedCountry(c); 
                                  setCountryDropdownOpen(false); 
                                  setCountrySearchQuery('');
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer ${
                                  isSelected 
                                    ? 'bg-blue-600/30 text-white border border-blue-500/40 font-bold' 
                                    : 'hover:bg-white/10 text-slate-300'
                                }`}
                              >
                                <img 
                                  src={`https://flagcdn.com/w40/${c.flagCode}.png`} 
                                  className="w-5 h-3.5 object-cover rounded-sm shadow-sm shrink-0" 
                                  alt="" 
                                  referrerPolicy="no-referrer"
                                />
                                <span className="flex-1 text-xs font-semibold truncate">{c.name}</span>
                                <span className={`text-xs font-mono font-bold shrink-0 ${isSelected ? 'text-blue-300' : 'text-blue-400'}`}>
                                  {c.code}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="py-6 px-3 text-center text-xs text-slate-400">
                            No countries found matching "{countrySearchQuery}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input 
                  type="tel" 
                  placeholder="Phone number" 
                  className="flex-1 bg-transparent px-4 text-sm font-bold text-white outline-none rounded-r-2xl min-w-0"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Access Key
                </label>
                <Input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 bg-white/5 border-white/10 text-white rounded-2xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Confirm
                </label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 bg-white/5 border-white/10 text-white rounded-2xl"
                  required
                />
              </div>
            </div>

            {/* Security Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Key className="w-3 h-3 text-amber-500" />
                  Payout PIN
                </label>
                <Input 
                  type="password" 
                  value={withdrawPassword}
                  onChange={e => setWithdrawPassword(e.target.value)}
                  placeholder="Security Key"
                  className="h-14 bg-white/5 border-white/10 text-white rounded-2xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Ticket className="w-3 h-3 text-blue-500" />
                  Invitation
                </label>
                <Input 
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  placeholder="Staff Code"
                  className="h-14 bg-white/5 border-white/10 text-white rounded-2xl"
                  readOnly={!!searchParams.get('ref') || !!searchParams.get('invite')}
                  required
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Use your recruiter's authorized staff code to successfully bind your merchant node to the global ledger.</p>
            </div>

            <div className="flex items-start gap-3 p-1">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  id="terms"
                  checked={termsAgreed} 
                  onChange={e => setTermsAgreed(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-2 border-white/10 bg-white/5 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer appearance-none"
                />
                <CheckCircle2 className={`absolute w-3 h-3 text-white pointer-events-none left-1 transition-opacity ${termsAgreed ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <label htmlFor="terms" className="text-[11px] text-slate-500 leading-relaxed font-medium">
                I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-500 font-black underline">Service Terms</button> and <button type="button" onClick={() => setShowPoliciesModal(true)} className="text-blue-500 font-black underline">Operational Policies</button>.
              </label>
            </div>

            <Button type="submit" className="w-full h-16 text-base group" isLoading={isLoading}>
              <span>Create Merchant Account</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-center text-xs font-bold text-slate-600 uppercase tracking-widest pt-2">
              Existing Member? <button type="button" onClick={() => navigate('/login')} className="text-blue-500 hover:underline">Sign In</button>
            </p>
          </form>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms of Service">
        <div className="space-y-6 text-sm text-slate-400">
          <p>By registering, you represent that you are at least 18 years of age and agree to all administrative bindings and verification checks.</p>
          <Button onClick={() => setShowTermsModal(false)} className="w-full">Agree & Continue</Button>
        </div>
      </Modal>

      <Modal isOpen={showPoliciesModal} onClose={() => setShowPoliciesModal(false)} title="Operational Policies">
        <div className="space-y-6 text-sm text-slate-400">
          <p>Walmart Global Matching utilizes advanced retail node distribution. Users must maintain liquidity to accept worksheets.</p>
          <Button onClick={() => setShowPoliciesModal(false)} className="w-full">Confirm Policy</Button>
        </div>
      </Modal>
    </div>
  );
}
