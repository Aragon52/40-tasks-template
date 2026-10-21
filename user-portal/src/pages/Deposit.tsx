import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ChevronLeft, 
  Copy, 
  CheckCircle2, 
  Upload, 
  Globe, 
  AlertTriangle, 
  Info,
  CreditCard,
  QrCode,
  RefreshCcw
} from 'lucide-react';
import { Button, Modal, Card, Input } from '@/src/shared/UI';
import toast from 'react-hot-toast';

// CDN base for official crypto color SVG icons
const CDN = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa/svg/color';

const NETWORKS = [
  { id: 'USDT (TRC20)', label: 'USDT', sub: 'TRC20',    color: '#26a17b', dbKey: 'usdt_address',       iconUrl: `${CDN}/usdt.svg` },
  { id: 'USDT (ERC20)', label: 'USDT', sub: 'ERC20',    color: '#627eea', dbKey: 'usdt_erc20_address',  iconUrl: `${CDN}/usdt.svg` },
  { id: 'BTC',          label: 'BTC',  sub: 'Bitcoin',   color: '#f7931a', dbKey: 'btc_address',         iconUrl: `${CDN}/btc.svg`  },
  { id: 'ETH',          label: 'ETH',  sub: 'Ethereum',  color: '#627eea', dbKey: 'eth_address',         iconUrl: `${CDN}/eth.svg`  },
  { id: 'BNB',          label: 'BNB',  sub: 'BEP20',     color: '#f3ba2f', dbKey: 'bnb_address',         iconUrl: `${CDN}/bnb.svg`  },
  { id: 'XRP',          label: 'XRP',  sub: 'Ripple',    color: '#00aae4', dbKey: 'xrp_address',         iconUrl: `${CDN}/xrp.svg`  },
  { id: 'SOL',          label: 'SOL',  sub: 'Solana',    color: '#9945ff', dbKey: 'sol_address',         iconUrl: `${CDN}/sol.svg`  },
  { id: 'DOGE',         label: 'DOGE', sub: 'Dogecoin',  color: '#c2a633', dbKey: 'doge_address',        iconUrl: `${CDN}/doge.svg` },
];

interface DepositProps {
  addPendingDeposit?: (req: any) => void;
}

export default function Deposit({ addPendingDeposit }: DepositProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [selectedNet, setSelectedNet] = useState(NETWORKS[0]);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [showIntlModal, setShowIntlModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addresses, setAddresses] = useState<any>({});

  const currentAddress = addresses[selectedNet.dbKey] || '';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('cb_deposit_settings')
          .select('*')
          .eq('id', 1)
          .single();
        if (!error && data) {
          setAddresses({
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
    fetchSettings();
  }, []);

  const handleCopy = () => {
    if (!currentAddress) return;
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    toast.success('Address copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      try {
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const generatedName = `deposit-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${fileExt}`;
        const filePath = `deposits/${generatedName}`;

        const { error: uploadError } = await supabase.storage
          .from('cb_storage')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('cb_storage')
          .getPublicUrl(filePath);

        setFileUrl(publicUrlData.publicUrl);
        toast.success('Receipt uploaded');
      } catch (err: any) {
        toast.error('Upload failed: ' + err.message);
        setFileName('');
        setFileUrl('');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter valid amount');
      return;
    }
    if (!fileUrl) {
      toast.error('Upload receipt screenshot');
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

      const newRequest = {
        id: 'DEP-' + Math.floor(10000 + Math.random() * 90000),
        user_id: userProfile?.id || session.id,
        username: session.username,
        amount: parseFloat(amount),
        currency: selectedNet.id,
        screenshot_name: fileName,
        screenshot_url: fileUrl,
        status: 'Pending',
        created_at: new Date().toISOString(),
        referred_by_staff_id: userProfile?.referred_by_staff_id || null,
        member_of_admin_id: userProfile?.member_of_admin_id || null,
      };

      const { error: depositError } = await supabase.from('cb_deposits').insert([newRequest]);
      if (depositError) throw depositError;

      toast.success(`Deposit of $${amount} submitted!`);
      navigate('/home');
    } catch (err: any) {
      toast.error('Submission failed: ' + err.message);
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
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Deposit Funds</h1>
          <div className="w-9" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* Step 1: Network Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Network</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map(net => (
              <button
                type="button"
                key={net.id}
                onClick={() => setSelectedNet(net)}
                className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                  selectedNet.id === net.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/10' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                }`}
              >
                <img src={net.iconUrl} alt={net.label} className="w-8 h-8 rounded-full shadow-sm" />
                <div className="text-center">
                  <p className={`text-[10px] font-black leading-none ${selectedNet.id === net.id ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{net.label}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{net.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Address & QR */}
        <Card className="p-5 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Payment Destination</h2>
          </div>

          {currentAddress ? (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-3xl shadow-premium">
                  <QRCodeSVG value={currentAddress} size={160} level="H" includeMargin />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <QrCode className="w-3 h-3" />
                  Scan to Pay
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official {selectedNet.id} Address</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 break-all leading-relaxed">
                    {currentAddress}
                  </div>
                  <Button type="button" onClick={handleCopy} size="sm" className="h-auto px-4">
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                  Only send <span className="font-black underline">{selectedNet.label}</span> on the <span className="font-black underline">{selectedNet.sub}</span> network. Sending other assets will result in permanent loss.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <Info className="w-8 h-8 text-slate-200" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400">Address not configured</p>
                <p className="text-[10px] text-slate-500">Contact support for manual deposit routing</p>
              </div>
            </div>
          )}
        </Card>

        {/* Step 3: Amount */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">3</div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Deposit Amount</h2>
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
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[50, 100, 500, 1000, 3000, 5000].map(val => (
              <button
                type="button"
                key={val}
                onClick={() => setAmount(val.toString())}
                className="h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-95"
              >
                +${val}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Receipt */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">4</div>
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Upload Receipt</h2>
          </div>
          
          <label className={`block w-full cursor-pointer transition-all ${uploading ? 'pointer-events-none' : ''}`}>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" required />
            <div className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center gap-4 text-center ${
              fileUrl 
                ? 'bg-emerald-50/30 border-emerald-200 dark:border-emerald-900/30' 
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900'
            }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${fileUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}>
                {uploading ? <RefreshCcw className="w-7 h-7 animate-spin" /> : fileUrl ? <CheckCircle2 className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-900 dark:text-white">{uploading ? 'Processing Screenshot...' : fileName || 'Tap to select screenshot'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JPG, PNG or GIF (Max 10MB)</p>
              </div>
            </div>
          </label>

          {fileUrl && (
            <Card className="p-3 bg-slate-50 dark:bg-slate-950 overflow-hidden">
              <img src={fileUrl} alt="Receipt Preview" className="w-full h-auto rounded-xl shadow-sm max-h-64 object-contain" />
            </Card>
          )}
        </div>

        <div className="pt-6 space-y-4">
          <Button type="submit" className="w-full h-16 text-base" isLoading={uploading}>
            Submit Deposit Request
          </Button>
          
          <div className="relative py-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800" /></div>
            <span className="relative px-4 bg-brand-ivory dark:bg-slate-950 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alternative</span>
          </div>

          <button
            type="button"
            onClick={() => setShowIntlModal(true)}
            className="w-full h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3 hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-[0.98] group"
          >
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">International Bank Wire</span>
          </button>
        </div>
      </form>

      {/* Intl Modal */}
      <Modal isOpen={showIntlModal} onClose={() => setShowIntlModal(false)} title="International Banking">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
            <Globe className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            For international wire transfers and swift processing, please connect with our specialized financial department representative.
          </p>
          <Button onClick={() => navigate('/support')} className="w-full h-14">
            Connect to Representative
          </Button>
          <Button variant="ghost" onClick={() => setShowIntlModal(false)} className="w-full">Close</Button>
        </div>
      </Modal>
    </div>
  );
}
