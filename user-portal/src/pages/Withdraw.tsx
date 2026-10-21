import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { 
  ChevronLeft, 
  Wallet, 
  ShieldCheck, 
  AlertCircle, 
  CreditCard, 
  ArrowRight,
  ShieldEllipsis,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Button, Card, Input } from '@/src/shared/UI';
import toast from 'react-hot-toast';

interface WithdrawProps {
  balance: number;
  updateBalance: (amount: number) => void;
  addPendingWithdraw?: (req: any) => void;
}

export default function Withdraw({ balance, updateBalance }: WithdrawProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('USDT (TRC20)');
  const [password, setPassword] = useState('');
  const [savedUsdtAddress, setSavedUsdtAddress] = useState('');
  const [savedBankName, setSavedBankName] = useState('');
  const [savedBankAccount, setSavedBankAccount] = useState('');
  const [savedBankHolder, setSavedBankHolder] = useState('');

  useEffect(() => {
    const loadSavedAddress = async () => {
      const sessionStr = localStorage.getItem('cb_user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      if (!session) return;
      const { data: users } = await supabase
        .from('cb_users')
        .select('usdt_address, bank_name, bank_account, bank_holder, withdraw_password, password')
        .eq('username', session.username);
      if (users && users[0]) {
        const u = users[0];
        setSavedUsdtAddress(u.usdt_address || '');
        setSavedBankName(u.bank_name || '');
        setSavedBankAccount(u.bank_account || '');
        setSavedBankHolder(u.bank_holder || '');
        if (u.usdt_address) setAddress(u.usdt_address);
      }
    };
    loadSavedAddress();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawVal = parseFloat(amount);
    if (!withdrawVal || withdrawVal <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (withdrawVal > balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!address) {
      toast.error("Provide receiving address");
      return;
    }

    const sessionStr = localStorage.getItem('cb_user_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const { data: users, error: userError } = await supabase
        .from('cb_users')
        .select('*')
        .eq('username', session.username);

      if (userError) throw userError;
      const userProfile = users && users[0];
      if (!userProfile) throw new Error("Profile not found");

      if (userProfile.withdraw === 'Disable' || userProfile.withdraw === 'Disabled') {
        toast.error("Withdrawals restricted by administrator");
        return;
      }

      const correctWithdrawPassword = userProfile.withdraw_password || userProfile.password;
      if (correctWithdrawPassword && correctWithdrawPassword !== password) {
        toast.error("Incorrect security password");
        return;
      }

      const newRequest = {
        id: 'WTH-' + Math.floor(10000 + Math.random() * 90000),
        user_id: userProfile?.id || session.id,
        username: session.username,
        amount: withdrawVal,
        method: paymentMethod,
        account_info: address,
        status: "Pending",
        created_at: new Date().toISOString(),
        referred_by_staff_id: userProfile?.referred_by_staff_id || null,
        member_of_admin_id: userProfile?.member_of_admin_id || null,
        remark: ""
      };

      const { error: withdrawError } = await supabase.from('cb_withdrawals').insert([newRequest]);
      if (withdrawError) throw withdrawError;

      updateBalance(-withdrawVal);
      toast.success(`Payout of $${withdrawVal.toFixed(2)} submitted!`);
      navigate('/home');
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-ivory dark:bg-slate-950 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Request Payout</h1>
          <div className="w-9" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* Balance Status */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
          <Card className="relative p-6 flex items-center justify-between bg-white dark:bg-slate-900 border-none shadow-premium">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Available Balance</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">${balance.toFixed(2)}</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setAmount(balance.toString())}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Payout All
            </button>
          </Card>
        </div>

        {/* Step 1: Method */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Method</h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {['USDT (TRC20)', 'USDT (ERC20)', 'Direct Bank Payout'].map(m => (
              <button
                type="button"
                key={m}
                onClick={() => {
                  setPaymentMethod(m);
                  if (m.includes('USDT')) setAddress(savedUsdtAddress);
                  else if (m === 'Direct Bank Payout') setAddress(savedBankAccount ? `${savedBankHolder} | ${savedBankName} | ${savedBankAccount}` : '');
                }}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  paymentMethod === m 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/10' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${paymentMethod === m ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-bold ${paymentMethod === m ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>{m}</span>
                </div>
                {paymentMethod === m && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Receiving Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Receiving Details</h2>
          </div>
          <Input 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder={paymentMethod === 'Direct Bank Payout' ? 'Bank | Holder | Account' : 'Enter wallet address'} 
            className="h-14 rounded-2xl shadow-sm"
            required
          />
          {(paymentMethod.includes('USDT') && savedUsdtAddress) && (
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight pl-1">✓ Using saved wallet from profile</p>
          )}
          {(paymentMethod === 'Direct Bank Payout' && savedBankName) && (
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight pl-1">✓ Using saved bank: {savedBankName}</p>
          )}
        </div>

        {/* Step 3: Amount */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">3</div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Withdraw Amount</h2>
          </div>
          <div className="relative">
            <Input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              placeholder="0.00" 
              className="pl-12 text-2xl font-black h-16 rounded-2xl shadow-sm"
              required
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">$</span>
          </div>
        </div>

        {/* Step 4: Verification */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">4</div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Security Verification</h2>
          </div>
          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">To authorize this payout, please enter your secure withdrawal password. This ensures only you can access your funds.</p>
            </div>
            <Input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter secure password" 
              className="bg-slate-50 dark:bg-slate-950 border-none"
              required
            />
          </Card>
        </div>

        {/* Warnings */}
        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Critical Notices</span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-[10px] text-rose-700 dark:text-rose-300 font-medium">
              <Clock className="w-3 h-3 shrink-0 mt-0.5" />
              Payouts are audited and processed by network nodes within 24 hours.
            </li>
            <li className="flex items-start gap-2 text-[10px] text-rose-700 dark:text-rose-300 font-medium">
              <ShieldEllipsis className="w-3 h-3 shrink-0 mt-0.5" />
              Ensure receiving details match your network. Incorrect info results in asset loss.
            </li>
          </ul>
        </div>

        <Button type="submit" className="w-full h-16 text-base group">
          <span>Authorize Payout</span>
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>
    </div>
  );
}
