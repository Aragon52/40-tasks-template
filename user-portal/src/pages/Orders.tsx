import React, { useState, useEffect } from 'react';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../components/GlobalLoader';
import { 
  Package, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

import toast from 'react-hot-toast';

const toMoneyAmount = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toCurrency = (value) => Number(toMoneyAmount(value).toFixed(2));
const toCommission = (value) => Number((toMoneyAmount(value) * 0.1).toFixed(4));

export default function Orders({ balance, orders, setOrders, updateBalance }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const { performAsync } = useLoading();

  const tabs = ['All', 'Success', 'Frozen'];

  // Filter out Pending orders from the page so only Success and Frozen orders are displayed
  const nonPendingOrders = (orders || []).filter(order => {
    const statusLower = String(order?.status || '').toLowerCase();
    return statusLower === 'success' || statusLower === 'frozen' || statusLower === 'completed' || statusLower === 'approved';
  });

  const filteredOrders = nonPendingOrders.filter(order => {
    if (activeTab === 'All') return true;
    const statusLower = String(order?.status || '').toLowerCase();
    if (activeTab === 'Success') {
      return statusLower === 'success' || statusLower === 'completed' || statusLower === 'approved';
    }
    if (activeTab === 'Frozen') {
      return statusLower === 'frozen';
    }
    return statusLower === activeTab.toLowerCase();
  });

  const handleSubmitTask = async (orderId, price, profit) => {
    const normalizedPrice = toCurrency(price);
    const normalizedProfit = toCurrency(profit);

    // Balance Check:
    if (toMoneyAmount(balance || 0) < normalizedPrice) {
      toast.error(`Insufficient balance to proceed with this order. Required: $${normalizedPrice.toFixed(2)}, Available: $${toCurrency(balance || 0).toFixed(2)}.`);
      navigate('/deposit');
      return;
    }
    
    // Find the matched order from the orders list
    const matchedOrder = orders.find(o => String(o.id) === String(orderId));

    // 1. OPTIMISTIC UI: Update local state & UI INSTANTLY (0ms delay)
    updateBalance(normalizedProfit);
    setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? { ...o, status: 'Success' } : o));
    setSelectedOrderDetails(null);
    toast.success(`Order submitted! Earned $${normalizedProfit.toFixed(2)} commission.`);

    // 2. PARALLEL BACKGROUND DATABASE SYNCHRONIZATION (NON-BLOCKING)
    Promise.all([
      supabase
        .from('cb_orders')
        .update({ status: 'Success' })
        .eq('id', orderId),

      (async () => {
        try {
          const currentUsername = localStorage.getItem('cb_username');
          if (currentUsername) {
            const { data: userBData } = await supabase
              .from('cb_users')
              .select('id, invited_by_user_id')
              .eq('username', currentUsername);

            if (userBData && userBData[0] && userBData[0].invited_by_user_id) {
              const { data: userAData } = await supabase
                .from('cb_users')
                .select('id, balance, commissions')
                .eq('id', userBData[0].invited_by_user_id);

              if (userAData && userAData[0]) {
                const userA = userAData[0];
                const commissionAmount = toCommission(normalizedProfit);
                if (commissionAmount > 0) {
                  const newA_Balance = Number((toMoneyAmount(userA.balance || 0) + commissionAmount).toFixed(4));
                  const newA_Commissions = Number((toMoneyAmount(userA.commissions || 0) + commissionAmount).toFixed(4));
                  await supabase
                    .from('cb_users')
                    .update({ balance: newA_Balance, commissions: newA_Commissions })
                    .eq('id', userA.id);
                }
              }
            }
          }
        } catch (affErr) {
          console.error("Affiliate error:", affErr);
        }
      })(),

      (async () => {
        if (matchedOrder && matchedOrder.assignedTaskId) {
          const { data: taskList } = await supabase
            .from('cb_assigned_tasks')
            .select('*')
            .eq('id', matchedOrder.assignedTaskId);

          const task = taskList && taskList[0];
          if (task && matchedOrder.assignedOrderIndex !== undefined && matchedOrder.assignedOrderIndex !== -1) {
            const updatedOrders = [...task.orders];
            const completedIdx = matchedOrder.assignedOrderIndex;
            updatedOrders[completedIdx].status = 'Success';

            let freshUserBalance = 0;
            const activeUser = localStorage.getItem('cb_username') || '';
            if (activeUser) {
              const { data: userData } = await supabase
                .from('cb_users')
                .select('balance')
                .ilike('username', activeUser.trim());
              if (userData && userData[0]) {
                freshUserBalance = parseFloat(userData[0].balance || 0);
              }
            }

            const currentEffectiveBalance = toMoneyAmount(balance) + normalizedProfit;
            if (isNaN(freshUserBalance) || currentEffectiveBalance > freshUserBalance) {
              freshUserBalance = currentEffectiveBalance;
            }

            const hasPendingSubsequent = updatedOrders.slice(completedIdx + 1).some((o: any) => o.status === 'Pending');

            if (hasPendingSubsequent && freshUserBalance > 0) {
              let runningBalance = freshUserBalance;

              for (let i = completedIdx + 1; i < updatedOrders.length; i++) {
                if (updatedOrders[i].status === 'Pending') {
                  const reduction = Math.random() * (37 - 18) + 18;
                  const newPrice = Math.max(10, parseFloat((runningBalance - reduction).toFixed(2)));
                  const profitRate = 0.002 + Math.random() * (0.003 - 0.002);
                  const newProfit = parseFloat((newPrice * profitRate).toFixed(2));

                  updatedOrders[i].price = newPrice;
                  updatedOrders[i].profit = newProfit;

                  runningBalance = parseFloat((runningBalance + newProfit).toFixed(2));
                }
              }
            }

            const allDone = updatedOrders.every(o => o.status === 'Success');
            const nextStatus = allDone ? 'Completed' : 'In Progress';
            const newTotalAmount = parseFloat(updatedOrders.reduce((sum: number, o: any) => sum + toMoneyAmount(o.price), 0).toFixed(2));
            const newTotalProfit = parseFloat(updatedOrders.reduce((sum: number, o: any) => sum + toMoneyAmount(o.profit), 0).toFixed(2));
            const newProfitPercent = newTotalAmount > 0 ? parseFloat(((newTotalProfit / newTotalAmount) * 100).toFixed(2)) : 0;

            await supabase
              .from('cb_assigned_tasks')
              .update({ 
                orders: updatedOrders, 
                status: nextStatus,
                total_amount: newTotalAmount,
                profit_percent: newProfitPercent
              })
              .eq('id', task.id);
          }
        }
      })()
    ]).then(async () => {
      const activeUser = localStorage.getItem('cb_username') || '';
      if (activeUser) {
        const { data: freshOrders } = await supabase
          .from('cb_orders')
          .select('*')
          .ilike('username', activeUser.trim())
          .order('timestamp', { ascending: false });

        if (freshOrders && freshOrders.length > 0) {
          setOrders(freshOrders);
        }
      }
    }).catch(err => {
      console.error("Background sync error:", err);
    });
  };

  return (
    <>
      <div className="orders-page scale-up">
        {/* Header replicated from Screenshot 4 */}
        <div className="orders-header">
          <button 
            type="button"
            className="header-back-btn cursor-pointer" 
            onClick={() => navigate('/home')}
            aria-label="Back to home"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <span className="orders-title">Worksheet Orders</span>
          <button 
            type="button"
            className="orders-chat-btn cursor-pointer" 
            onClick={() => navigate('/support')}
            aria-label="Support chat"
          >
            <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="tabs-container">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              id={`btn-tab-${tab.toLowerCase()}`}
            >
              {tab}
              {activeTab === tab && <span className="tab-indicator"></span>}
            </button>
          ))}
        </div>

        {/* Order items list */}
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-orders">
              <ShoppingBag className="w-12 h-12 text-slate-300 mb-2" />
              <span>No orders found in this category</span>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div 
                className="order-item-card" 
                key={order.id} 
                id={`order-${order.id}`}
                onClick={() => setSelectedOrderDetails(order)}
                style={{ cursor: 'pointer' }}
              >
                <div className="order-item-header">
                  <span className="order-timestamp">
                    <Clock className="w-3 h-3" />
                    {order.timestamp}
                  </span>
                  <span className={`badge badge-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                <div className="order-item-body">
                  <div className="product-image-container">
                    {order.image ? (
                      <img src={order.image} alt={order.title} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    )}
                  </div>
                  <div className="product-info">
                    <span className="product-title">{order.title}</span>
                  </div>
                </div>

                <div className="order-price-box">
                  <div className="price-col">
                    <span className="price-label">Price</span>
                    <span className="price-value">$ {order.price}</span>
                  </div>
                  <div className="profit-col">
                    <span className="profit-label">Profit</span>
                    <span className="profit-value">+$ {order.profit}</span>
                  </div>
                </div>

                {order.status === 'Pending' && parseFloat(balance || 0) < parseFloat(order.price) && (
                  <div className="diff-amount-badge-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '10px 12px', borderRadius: '12px', fontSize: '11px' }}>
                    <span style={{ color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Difference:
                    </span>
                    <span style={{ color: '#ef4444', fontWeight: '800', fontFamily: 'monospace' }}>$ {(parseFloat(order.price) - parseFloat(balance || 0)).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-medium">Order ID: VP{order.id}</span>
                  <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold text-[11px]">
                    View Details
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                {order.status === 'Pending' && (
                  <div className="order-item-actions pt-1">
                    <button
                      className="submit-task-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderDetails(order);
                      }}
                      id={`btn-submit-task-${order.id}`}
                    >
                      Submit Task
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedOrderDetails && (
        <OrderDetailsModal
          order={selectedOrderDetails}
          balance={balance}
          onClose={() => setSelectedOrderDetails(null)}
          onSubmit={(orderId, price, profit) => {
            handleSubmitTask(orderId, price, profit);
            setSelectedOrderDetails(null);
          }}
        />
      )}

      <style>{`
        .orders-page {
          display: flex;
          flex-direction: column;
          background-color: var(--bg-app);
          width: 100%;
          padding-bottom: 24px;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 48px;
          padding: 0 12px;
          background-color: var(--bg-nav);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .header-back-btn, .orders-chat-btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: var(--text-main);
          background: var(--bg-input);
          transition: all 0.2s;
        }

        .header-back-btn:active, .orders-chat-btn:active {
          transform: scale(0.92);
          background: rgba(0, 0, 0, 0.08);
        }

        .orders-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.2px;
        }

        /* Tabs styles */
        .tabs-container {
          display: flex;
          background-color: var(--bg-nav);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          height: 48px;
          padding: 0 8px;
          gap: 4px;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          position: relative;
          transition: all 0.2s;
          border-radius: 10px;
          margin: 6px 0;
        }

        .tab-btn.active {
          color: var(--primary-color);
          background: var(--primary-light);
        }

        .tab-indicator {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          background-color: var(--primary-color);
          border-radius: 2px;
        }

        /* Order card list styles */
        .orders-list {
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (min-width: 640px) {
          .orders-list {
            display: flex;
            flex-direction: column;
            max-width: 680px;
            margin: 0 auto;
            width: 100%;
          }
        }

        .order-item-card {
          background-color: var(--bg-card);
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          padding: 24px; /* min p-6 */
          display: flex;
          flex-direction: column;
          gap: 16px; /* space-y feel */
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .order-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          border-color: rgba(0, 113, 206, 0.1);
        }

        .order-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-timestamp {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-light);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .badge {
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .badge-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .badge-success {
          background-color: #d1fae5;
          color: #065f46;
        }

        .badge-frozen {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .order-item-body {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .product-image-container {
          width: 72px;
          height: 72px;
          border-radius: 12px;
          background: var(--bg-input);
          border: 1px solid rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .product-info {
          flex: 1;
          min-width: 0;
        }

        .product-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .order-price-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #f8fafc;
          border-radius: 14px;
          padding: 16px; /* p-4 minimum */
          gap: 12px;
          border: 1px solid rgba(0, 0, 0, 0.02);
        }

        .dark .order-price-box {
          background: #0f172a;
        }

        .price-col, .profit-col {
          display: flex;
          flex-direction: column;
        }

        .price-value {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-main);
          font-family: var(--font-secondary);
        }

        .profit-value {
          font-size: 16px;
          font-weight: 800;
          color: #10b981;
          font-family: var(--font-secondary);
        }

        .price-label, .profit-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .submit-task-btn {
          width: 100%;
          height: 48px; /* h-12 touch target */
          background: var(--primary-gradient);
          color: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 113, 206, 0.2);
          transition: all 0.2s;
        }

        .submit-task-btn:active {
          transform: scale(0.98);
          opacity: 0.9;
        }

        .empty-orders {
          padding: 80px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--text-light);
        }
      `}</style>
    </>
  );
}
