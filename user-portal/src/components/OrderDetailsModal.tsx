import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string | number;
  title: string;
  image?: string | null;
  price: number | string;
  profit: number | string;
  status: string;
  timestamp?: string;
  assignedTaskId?: string;
  assignedOrderIndex?: number;
  type?: string;
}

interface OrderDetailsModalProps {
  order: Order | null;
  balance?: number | string;
  onClose: () => void;
  onSubmit: (id: string | number, price: number | string, profit: number | string) => void;
  onCancel?: () => void;
}

export default function OrderDetailsModal({
  order,
  balance = 0,
  onClose,
  onSubmit,
  onCancel
}: OrderDetailsModalProps) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(299); // 4:59

  useEffect(() => {
    if (!order) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order]);

  if (!order) return null;

  const isPending = String(order.status || '').toLowerCase() === 'pending';
  const userBalance = Number.parseFloat(String(balance ?? '0')) || 0;
  const orderPrice = Number.parseFloat(String(order.price ?? '0')) || 0;
  const isBalanceSufficient = userBalance >= orderPrice;
  const orderProfit = Number.parseFloat(String(order.profit ?? '0')) || 0;
  const totalSettlement = orderPrice + orderProfit;
  const differenceAmount = Math.max(0, orderPrice - userBalance);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(order.id, order.price, order.profit);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Clean Modern Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h3 className="text-base font-bold">Order Details</h3>
            <p className="text-xs text-blue-100 font-mono uppercase tracking-wide">TRANSACTION ID: {order.id}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body with Generous Spacing */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Status Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ALLOCATION ACTIVE
            </span>
            <span className="text-xs font-mono font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
              ⏱ {formatTime(timeLeft)}
            </span>
          </div>

          {/* Product Image & Title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-36 h-36 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-center shadow-inner">
              {order.image ? (
                <img src={order.image} alt={order.title} className="max-h-full object-contain" />
              ) : (
                <div className="text-slate-300 font-bold text-xs uppercase">No Image</div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{order.title}</h4>
              <span className="mt-1 inline-block text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                PRIORITY MATCHING
              </span>
            </div>
          </div>

          {/* Financial Details (Receipt Layout) */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Order Amount</span>
              <span className="font-semibold text-slate-800">${orderPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Matching Profit</span>
              <span className="font-semibold text-emerald-600">+${orderProfit.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Expected Payout</span>
              <span className="text-lg font-extrabold text-blue-600">${totalSettlement.toFixed(2)}</span>
            </div>
          </div>

          {/* Balance Bar */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-base">💼</span>
              <span className="text-xs font-semibold text-emerald-900">Personal Balance</span>
            </div>
            <span className="text-sm font-extrabold text-emerald-700">${userBalance.toFixed(2)}</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {isPending ? (
              isBalanceSufficient ? (
                <button 
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs tracking-wider rounded-xl uppercase transition-all shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Complete Submission'}
                </button>
              ) : (
                <button 
                  onClick={() => {
                    onClose();
                    navigate('/deposit');
                  }}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs tracking-wider rounded-xl uppercase transition-all shadow-md cursor-pointer"
                >
                  Recharge & Continue (${differenceAmount.toFixed(2)} Required)
                </button>
              )
            ) : (
              <div className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-emerald-200 text-center">
                ✓ Matching Successful
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
