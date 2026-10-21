import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { supabase } from '../supabase';
import { useLoading } from '../components/GlobalLoader';
import { PRODUCT_CATALOG, TEMPLATE_M_1 } from '../data/products';
import toast from 'react-hot-toast';
import {
  Package,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  Wallet,
  ShieldAlert,
  ChevronLeft,
  MessageSquare,
  Sparkles,
  Info,
  Plus,
  RefreshCw
} from 'lucide-react';

const ITEM_HEIGHT = 195; // Pixel height of each item in the slot reel

const toMoneyAmount = (value: any) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toCurrency = (value: any) => Number(toMoneyAmount(value).toFixed(2));
const toCommission = (value: any) => Number((toMoneyAmount(value) * 0.1).toFixed(4));

interface ShopOrderProps {
  balance: number | string;
  updateBalance: (amount: number) => void;
  orders: any[];
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ShopOrder({ balance, updateBalance, orders, setOrders }: ShopOrderProps) {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [activeOrderDetails, setActiveOrderDetails] = useState<any>(null);
  const [reelProducts, setReelProducts] = useState<any[]>([]);
  const [reelTranslateY, setReelTranslateY] = useState(0);
  const spinTimeoutRef = useRef<any>(null);

  // Derive stats from orders list and active task
  const [orderCompleteCount, setOrderCompleteCount] = useState(0);
  const [undoneCount, setUndoneCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(40);
  const [totalCommission, setTotalCommission] = useState('0.00');
  const [activeTaskState, setActiveTaskState] = useState<any>(null);

  const fetchActiveTaskAndStats = async () => {
    const activeUser = localStorage.getItem('cb_username') || '';
    if (!activeUser) return;
    if (document.hidden) return;
    try {
      const { data: tasks, error: taskError } = await supabase
        .from('cb_assigned_tasks')
        .select('*')
        .ilike('username', activeUser)
        .in('status', ['Pending', 'In Progress'])
        .order('created_at', { ascending: false });

      let activeTask = tasks && tasks.length > 0 ? tasks[0] : null;
      if (!activeTask) {
        const { data: fallbackTasks } = await supabase
          .from('cb_assigned_tasks')
          .select('*')
          .ilike('username', activeUser)
          .order('created_at', { ascending: false });
        if (fallbackTasks && fallbackTasks.length > 0) {
          activeTask = fallbackTasks[0];
        }
      }

      if (activeTask) {
        const parsedOrders = Array.isArray(activeTask.orders)
          ? activeTask.orders
          : (typeof activeTask.orders === 'string' ? JSON.parse(activeTask.orders) : []);
        activeTask.orders = parsedOrders;
        setActiveTaskState(activeTask);
        setTotalTasks(activeTask.order_count || parsedOrders.length || 40);

        const completed = parsedOrders.filter((o: any) => o.status === 'Success').length;
        setOrderCompleteCount(completed);

        const pending = orders.filter((o: any) => o.status === 'Pending' && o.assignedTaskId === activeTask.id).length;
        setUndoneCount(pending);

        const comm = parsedOrders
          .filter((o: any) => o.status === 'Success')
          .reduce((acc: number, curr: any) => acc + toMoneyAmount(curr.profit), 0);
        setTotalCommission(comm.toFixed(2));
      } else {
        setActiveTaskState(null);
        setTotalTasks(40);
        setOrderCompleteCount(0);
        setUndoneCount(0);
        setTotalCommission('0.00');
      }
    } catch (err) {
      console.error("Error syncing stats with database:", err);
    }
  };

  useEffect(() => {
    fetchActiveTaskAndStats();
    const interval = setInterval(() => {
      if (document.hidden) return;
      fetchActiveTaskAndStats();
    }, 15000);
    return () => clearInterval(interval);
  }, [orders]);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const remainingCount = activeTaskState 
    ? Math.max(0, totalTasks - orderCompleteCount) 
    : Math.max(0, totalTasks - orderCompleteCount - undoneCount);

  const freezeBalance = orders
    .filter(o => o.status === 'Frozen')
    .reduce((acc, curr) => acc + toMoneyAmount(curr.price), 0)
    .toFixed(2);

  const handleModalSubmit = async (orderId: string | number, price: number | string, profit: number | string) => {
    const normalizedPrice = toCurrency(price);
    const normalizedProfit = toCurrency(profit);

    // Check if user has sufficient balance
    if (toMoneyAmount(balance) < normalizedPrice) {
      toast.error(`Insufficient balance to proceed with this order. Required: $${normalizedPrice.toFixed(2)}, Available: $${toCurrency(balance).toFixed(2)}.`);
      navigate('/deposit');
      return;
    }

    // 1. OPTIMISTIC UI: Update local balance, orders state, and UI INSTANTLY (0ms delay)
    updateBalance(normalizedProfit);
    setOrders(prev => prev.map(o => {
      const isMatch = String(o.id) === String(orderId) || 
        (activeOrderDetails?.assignedTaskId && 
         String(o.assignedTaskId || o.assigned_task_id) === String(activeOrderDetails.assignedTaskId) && 
         Number(o.assignedOrderIndex !== undefined ? o.assignedOrderIndex : o.assigned_order_index) === Number(activeOrderDetails.assignedOrderIndex));
      return isMatch ? { ...o, status: 'Success' } : o;
    }));
    toast.success(`Task submitted successfully! Earned $${normalizedProfit.toFixed(2)} commission.`);
    setActiveOrderDetails(null);

    // 2. PARALLEL BACKGROUND DATABASE SYNCHRONIZATION (NON-BLOCKING)
    Promise.all([
      (async () => {
        if (orderId) {
          await supabase.from('cb_orders').update({ status: 'Success' }).eq('id', orderId);
        }
        if (activeOrderDetails?.assignedTaskId && activeOrderDetails?.assignedOrderIndex !== undefined && activeOrderDetails?.assignedOrderIndex !== -1) {
          await supabase
            .from('cb_orders')
            .update({ status: 'Success' })
            .eq('assigned_task_id', activeOrderDetails.assignedTaskId)
            .eq('assigned_order_index', activeOrderDetails.assignedOrderIndex);
        }
      })(),
      (async () => {
        try {
          if (activeOrderDetails && activeOrderDetails.assignedTaskId) {
            const { data: taskList } = await supabase
              .from('cb_assigned_tasks')
              .select('*')
              .eq('id', activeOrderDetails.assignedTaskId);

            const task = taskList && taskList[0];
            const taskOrders = Array.isArray(task?.orders) ? task.orders : (typeof task?.orders === 'string' ? JSON.parse(task.orders || '[]') : []);
            const isAiEdgeTask = task && (
              task.disable_referral_commission || 
              task.task_type === 'ai_edge' || 
              taskOrders?.[0]?.task_type === 'ai_edge' || 
              taskOrders?.[0]?.disable_referral_commission
            );

            if (isAiEdgeTask) return;
          }

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
          console.error("Affiliate reward error:", affErr);
        }
      })(),
      (async () => {
        if (activeOrderDetails && activeOrderDetails.assignedTaskId) {
          const { data: taskList } = await supabase
            .from('cb_assigned_tasks')
            .select('*')
            .eq('id', activeOrderDetails.assignedTaskId);

          const task = taskList && taskList[0];
          if (task && activeOrderDetails.assignedOrderIndex !== undefined && activeOrderDetails.assignedOrderIndex !== -1) {
            const taskOrders = Array.isArray(task.orders)
              ? task.orders
              : (typeof task.orders === 'string' ? JSON.parse(task.orders) : []);
            
            const completedIdx = activeOrderDetails.assignedOrderIndex;
            if (taskOrders[completedIdx]) {
              taskOrders[completedIdx].status = 'Success';

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

              const hasPendingSubsequent = taskOrders.slice(completedIdx + 1).some((o: any) => o.status === 'Pending');

              if (hasPendingSubsequent && freshUserBalance > 0) {
                let runningBalance = freshUserBalance;

                for (let i = completedIdx + 1; i < taskOrders.length; i++) {
                  if (taskOrders[i].status === 'Pending') {
                    const reduction = Math.random() * (37 - 18) + 18;
                    const newPrice = Math.max(10, parseFloat((runningBalance - reduction).toFixed(2)));
                    const profitRate = 0.002 + Math.random() * (0.003 - 0.002);
                    const newProfit = parseFloat((newPrice * profitRate).toFixed(2));

                    taskOrders[i].price = newPrice;
                    taskOrders[i].profit = newProfit;

                    runningBalance = parseFloat((runningBalance + newProfit).toFixed(2));
                  }
                }
              }

              const allDone = taskOrders.every((o: any) => o.status === 'Success');
              const nextStatus = allDone ? 'Completed' : 'In Progress';
              const newTotalAmount = parseFloat(taskOrders.reduce((sum: number, o: any) => sum + toMoneyAmount(o.price), 0).toFixed(2));
              const newTotalProfit = parseFloat(taskOrders.reduce((sum: number, o: any) => sum + toMoneyAmount(o.profit), 0).toFixed(2));
              const newProfitPercent = newTotalAmount > 0 ? parseFloat(((newTotalProfit / newTotalAmount) * 100).toFixed(2)) : 0;

              setActiveTaskState((prev: any) => prev ? { 
                ...prev, 
                orders: [...taskOrders], 
                status: nextStatus,
                total_amount: newTotalAmount,
                profit_percent: newProfitPercent
              } : null);

              const completedCount = taskOrders.filter((o: any) => o.status === 'Success').length;
              setOrderCompleteCount(completedCount);

              const comm = taskOrders
                .filter((o: any) => o.status === 'Success')
                .reduce((acc: number, curr: any) => acc + toMoneyAmount(curr.profit), 0);
              setTotalCommission(comm.toFixed(2));

              await supabase
                .from('cb_assigned_tasks')
                .update({ 
                  orders: taskOrders, 
                  status: nextStatus,
                  total_amount: newTotalAmount,
                  profit_percent: newProfitPercent
                })
                .eq('id', task.id);
            }
          }
        }
      })()
    ]).catch(err => {
      console.error("Background sync error:", err);
    });
  };

  const handleBeginPicking = async () => {
    if (remainingCount <= 0) {
      toast("You have completed all tasks for today!");
      return;
    }
    if (undoneCount > 0 && !activeTaskState) {
      toast("You have an outstanding pending order. Please complete it first!");
      navigate('/orders');
      return;
    }

    const activeUser = localStorage.getItem('cb_username') || '';

    // Step 1: Identify fresh task & orders to precisely select the N-th product to be picked up
    let activeTask = activeTaskState;
    try {
      const { data: freshTasks } = await supabase
        .from('cb_assigned_tasks')
        .select('*')
        .ilike('username', activeUser)
        .in('status', ['Pending', 'In Progress'])
        .order('created_at', { ascending: false });

      if (freshTasks && freshTasks.length > 0) {
        activeTask = freshTasks[0];
        if (typeof activeTask.orders === 'string') {
          activeTask.orders = JSON.parse(activeTask.orders);
        }
        setActiveTaskState(activeTask);
      }
    } catch (e) {
      console.warn("Could not pre-fetch fresh task:", e);
    }

    const taskOrders = activeTask?.orders && Array.isArray(activeTask.orders) ? activeTask.orders : [];
    let chosenProduct: any = null;
    let assignedTaskId: any = null;
    let assignedOrderIndex = -1;

    if (activeTask && taskOrders.length > 0) {
      const pendingOrderIdx = taskOrders.findIndex((o: any) => o.status === 'Pending');
      if (pendingOrderIdx !== -1) {
        const assignedOrder = taskOrders[pendingOrderIdx];
        const realOrder = orders.find(
          (o: any) => 
            (String(o.assignedTaskId || o.assigned_task_id) === String(activeTask.id)) && 
            Number(o.assignedOrderIndex !== undefined ? o.assignedOrderIndex : o.assigned_order_index) === pendingOrderIdx
        );

        chosenProduct = {
          id: realOrder ? realOrder.id : (assignedOrder.id || `task-${activeTask.id}-${pendingOrderIdx}`),
          title: assignedOrder.title,
          image: assignedOrder.image,
          price: toCurrency(assignedOrder.price).toFixed(2),
          profit: toCurrency(assignedOrder.profit).toFixed(2),
          type: assignedOrder.type || 'gear',
          orderSequence: pendingOrderIdx + 1
        };
        assignedTaskId = activeTask.id;
        assignedOrderIndex = pendingOrderIdx;

        // Set task status to In Progress if it was Pending
        if (activeTask.status === 'Pending') {
          await supabase
            .from('cb_assigned_tasks')
            .update({ status: 'In Progress' })
            .eq('id', activeTask.id);
        }
      }
    }

    // Fallback template pool if no active task is found
    const fallbackCatalog = (TEMPLATE_M_1 && TEMPLATE_M_1.length > 0) ? TEMPLATE_M_1 : PRODUCT_CATALOG;
    if (!chosenProduct) {
      const nthIndex = orderCompleteCount % fallbackCatalog.length;
      const templateItem = fallbackCatalog[nthIndex];
      chosenProduct = {
        id: Date.now(),
        title: templateItem.title,
        image: templateItem.image || null,
        price: toCurrency(templateItem.price || 199.99).toFixed(2),
        profit: toCurrency(templateItem.profit || 1.99).toFixed(2),
        type: (templateItem as any).type || 'gear',
        orderSequence: nthIndex + 1
      };
    }

    // Step 2: Build the dynamic spinning reel.
    // The reel displays diverse rotating items and culminates precisely at STOP_INDEX on the N-th product.
    const pool = taskOrders.length > 0 ? taskOrders : fallbackCatalog;
    const REEL_LENGTH = 12;
    const STOP_INDEX = REEL_LENGTH - 1; // 11

    const reel = [];
    for (let i = 0; i < STOP_INDEX; i++) {
      const sampleItem = pool[(i + (assignedOrderIndex >= 0 ? assignedOrderIndex : orderCompleteCount) + 1) % pool.length];
      reel.push({
        id: `reel-${i}`,
        title: sampleItem.title,
        image: sampleItem.image,
        price: toCurrency(sampleItem.price).toFixed(2),
        profit: toCurrency(sampleItem.profit).toFixed(2),
        type: (sampleItem as any).type || 'gear'
      });
    }
    // Set the exact chosen N-th product as the final landing position
    reel.push(chosenProduct);

    setReelProducts(reel);
    setReelTranslateY(0);
    setSpinResult(null);
    setSpinning(true);

    // Step 3: Trigger the deceleration scroll animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        setReelTranslateY(-STOP_INDEX * ITEM_HEIGHT);
      }, 35);
    });

    // Step 4: After reel stops precisely on the N-th product (2.1s), present modal & sync
    spinTimeoutRef.current = setTimeout(async () => {
      try {
        const newOrder = {
          id: chosenProduct.id || Date.now(),
          username: activeUser,
          timestamp: new Date().toISOString(),
          status: 'Pending',
          title: chosenProduct.title,
          image: chosenProduct.image || null,
          price: toCurrency(chosenProduct.price),
          profit: toCurrency(chosenProduct.profit),
          type: chosenProduct.type,
          assigned_task_id: assignedTaskId || null,
          assigned_order_index: assignedOrderIndex !== -1 ? assignedOrderIndex : null
        };

        // Always insert or upsert matched order into cb_orders database table
        const { error: insertOrderError } = await supabase
          .from('cb_orders')
          .upsert([newOrder], { onConflict: 'id' });

        if (insertOrderError) {
          console.warn("Upsert Order warning, attempting direct insert:", insertOrderError.message);
          await supabase.from('cb_orders').insert([newOrder]);
        }

        const formattedNewOrder = {
          id: newOrder.id,
          timestamp: new Date(newOrder.timestamp).toLocaleString(),
          status: newOrder.status,
          title: newOrder.title,
          image: newOrder.image,
          price: newOrder.price.toString(),
          profit: newOrder.profit.toString(),
          type: newOrder.type,
          assignedTaskId: newOrder.assigned_task_id,
          assignedOrderIndex: newOrder.assigned_order_index
        };

        setOrders(prev => {
          const exists = prev.some(o => String(o.id) === String(newOrder.id));
          if (exists) {
            return prev.map(o => String(o.id) === String(newOrder.id) ? formattedNewOrder : o);
          }
          return [formattedNewOrder, ...prev];
        });

        setSpinResult(chosenProduct);
        setSpinning(false);
        
        // Brief delay after spin stops to highlight the allocated product before popping the modal
        setTimeout(() => {
          if (!activeUser) return; // Guard against unmount
          setActiveOrderDetails({
            id: newOrder.id,
            timestamp: new Date().toLocaleString(),
            status: newOrder.status,
            title: newOrder.title,
            image: newOrder.image,
            price: newOrder.price.toString(),
            profit: newOrder.profit.toString(),
            type: newOrder.type,
            assignedTaskId: newOrder.assigned_task_id,
            assignedOrderIndex: newOrder.assigned_order_index
          });
        }, 600);
      } catch (err) {
        console.error("Match loop error:", err);
        setSpinning(false);
      }
    }, 2150);
  };

  const nextOrderNum = orderCompleteCount + 1;

  return (
    <>
      <div className="shop-order-page scale-up pb-8">
        {/* Header bar */}
        <div className="shop-header">
          <button 
            type="button"
            className="header-back-btn cursor-pointer" 
            onClick={() => navigate('/home')}
            aria-label="Back to home"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <span className="shop-title">Order Pickup</span>
          <button 
            type="button"
            className="shop-chat-btn cursor-pointer" 
            onClick={() => navigate('/support')}
            aria-label="Support chat"
          >
            <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
        </div>

        {/* Content body */}
        <div className="shop-content">
          <div className="shop-grid-layout">
            <div className="shop-left-col">
              {/* Balance card with "+" button */}
              <div className="shop-balance-card">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="balance-info-col">
                    <span className="balance-amount-title">$ {parseFloat(String(balance || 0)).toFixed(2)}</span>
                    <span className="balance-sub-label">Balance</span>
                  </div>
                </div>
                <button 
                  className="add-balance-btn cursor-pointer" 
                  onClick={() => navigate('/deposit')} 
                  id="btn-add-balance"
                  title="Add balance"
                  aria-label="Deposit balance"
                >
                  <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                </button>
              </div>

              {/* Standalone daily task stats card with icons */}
              <div className="matching-stats-card">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h4 className="stats-card-title m-0 p-0 border-0">Daily Task Statistics</h4>
                </div>
                <div className="stats-card-grid pt-1">
                  <div className="stats-card-col">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="stats-card-lbl">Completed</span>
                    </div>
                    <span className="stats-card-num">{orderCompleteCount} / {totalTasks}</span>
                  </div>
                  <div className="stats-card-col">
                    <div className="flex items-center justify-center gap-1.5 text-sky-600 dark:text-sky-400 mb-0.5">
                      <Clock className="w-4 h-4" />
                      <span className="stats-card-lbl">Remaining</span>
                    </div>
                    <span className="stats-card-num">{remainingCount}</span>
                  </div>
                </div>
              </div>

              {/* Visual Module: Decelerating Slot Reel & High-Visibility Allocation Node */}
              <div className="matching-visual-box">
                {spinning ? (
                  <div className="slot-container">
                    <div 
                      className="slot-track"
                      style={{
                        transform: `translateY(${reelTranslateY}px)`,
                        transition: reelTranslateY !== 0 ? 'transform 2.0s cubic-bezier(0.12, 0.8, 0.33, 1)' : 'none'
                      }}
                    >
                      {reelProducts.map((item, idx) => (
                        <div className="slot-item" key={item.id || idx}>
                          <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0 mb-1.5 shadow-xs overflow-hidden relative">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-full h-full object-contain" 
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                  const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                  if (fb) fb.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-full h-full flex items-center justify-center text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                              style={{ display: item.image ? 'none' : 'flex' }}
                            >
                              <Package className="w-6 h-6" />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 px-3 text-center truncate max-w-[90%]">
                            {item.title}
                          </span>
                          <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                            $ {item.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : spinResult ? (
                  /* High-Fidelity Allocated Product Showcase Card */
                  <div className="slot-container static flex items-center justify-center p-3.5 bg-gradient-to-br from-white via-sky-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-sky-950/20">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 p-4 rounded-2xl border border-sky-100 dark:border-sky-800 shadow-xl shadow-sky-500/5 flex flex-col gap-3.5 animate-in zoom-in-95 duration-300">
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Allocation Successful</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">#VP{spinResult.id}</span>
                      </div>

                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-950 p-1 flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden relative shadow-sm">
                          {spinResult.image ? (
                            <img src={spinResult.image} alt={spinResult.title} className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-7 h-7 text-sky-600" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[10px] font-semibold text-sky-600 uppercase mb-0.5">Worksheet Order #{orderCompleteCount + 1}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate leading-snug">
                            {spinResult.title}
                          </span>
                          <div className="flex items-center gap-2.5 mt-1.5">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Price</span>
                              <span className="text-[13px] font-extrabold font-mono text-slate-900 dark:text-slate-100">$ {spinResult.price}</span>
                            </div>
                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-emerald-500 uppercase">Comm.</span>
                              <span className="text-[13px] font-extrabold font-mono text-emerald-600">+$ {spinResult.profit}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-1 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/30 rounded-xl p-2.5 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">Ready for worksheet submission</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Solid High-Visibility Product Pickup Podium & Representative Product Icon */
                  <div className="slot-container static flex items-center justify-center p-4 bg-gradient-to-br from-white via-sky-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20">
                    <div className="flex flex-col items-center justify-center text-center w-full">
                      <div className="relative mb-2.5 flex items-center justify-center">
                        <div className="product-pickup-podium bounce-slow">
                          <div className="podium-glow-ring" />
                          <div className="podium-core-circle">
                            {/* Products Representative Icon */}
                            <div className="relative flex items-center justify-center">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
                                <ShoppingBag className="w-6 h-6 text-white drop-shadow-xs" />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-amber-400 border border-white dark:border-slate-800 flex items-center justify-center text-slate-950 shadow-xs">
                                  <Package className="w-3.5 h-3.5 text-slate-950" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                        <span>Ready for Order #{nextOrderNum} of {totalTasks}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Initiate Product Order Pickup
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Begin Picking Button */}
              <button 
                className={`begin-match-btn ${spinning ? 'disabled' : 'pulse-glow-blue'}`}
                onClick={handleBeginPicking}
                disabled={spinning || remainingCount <= 0}
                id="btn-begin-matching"
              >
                <span className="begin-match-btn-label flex items-center justify-center gap-2">
                  {spinning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Picking Order #{nextOrderNum}...</span>
                    </>
                  ) : remainingCount <= 0 ? (
                    <span>All Daily Tasks Completed</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Begin Picking (Order #{nextOrderNum})</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            <div className="shop-right-col">
              {/* Stats grid block below (white card) with clear icons */}
              <div className="stats-report-card">
                <div className="report-grid">
                  <div className="report-item">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      <span className="report-lbl">Total Commission</span>
                    </div>
                    <span className="report-val font-mono text-emerald-600 dark:text-emerald-400">$ {totalCommission}</span>
                  </div>

                  <div className="report-item">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span className="report-lbl">Freeze Balance</span>
                    </div>
                    <span className="report-val font-mono text-amber-600 dark:text-amber-400">$ {freezeBalance}</span>
                  </div>

                  <div className="report-item">
                    <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 mb-1">
                      <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                      <span className="report-lbl">Order number</span>
                    </div>
                    <span className="report-val font-mono">{orderCompleteCount}</span>
                  </div>

                  <div className="report-item">
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
                      <Wallet className="w-3.5 h-3.5 shrink-0" />
                      <span className="report-lbl">My balance</span>
                    </div>
                    <span className="report-val font-mono">$ {toCurrency(balance).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Store rules */}
              <div className="store-rules-container">
                <div className="flex items-center gap-2 mb-2.5">
                  <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <h4 className="rules-title m-0 p-0 border-0">Take a closer look at the store rules:</h4>
                </div>
                <ol className="rules-list">
                  <li>Every order in our store will be randomly assigned to customers. Prevent illegal post-shipment activities such as money laundering and withdrawals for malicious purposes. The user must complete the work after the worksheet is launched. And the job cannot be canceled midway, otherwise the system will not allow withdrawals.</li>
                  <li>The commission for each order will be distributed immediately upon submission.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeOrderDetails && (
        <OrderDetailsModal
          order={activeOrderDetails}
          balance={balance}
          onClose={() => setActiveOrderDetails(null)}
          onCancel={() => setActiveOrderDetails(null)}
          onSubmit={handleModalSubmit}
        />
      )}

      <style>{`
        .shop-order-page {
          display: flex;
          flex-direction: column;
        }

        .shop-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 54px;
          padding: 0 16px;
          background-color: var(--bg-nav);
          border-bottom: var(--border-glass);
        }

        .header-back-btn, .shop-chat-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: var(--text-muted);
          transition: background-color 0.2s;
        }

        .header-back-btn:hover, .shop-chat-btn:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }

        .shop-title {
          font-size: 17px;
          font-weight: 600;
          color: var(--text-main);
        }

        .shop-content {
          padding: 24px 20px 48px;
        }

        .shop-grid-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
        }

        .shop-left-col, .shop-right-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .shop-grid-layout {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
          }
        }

        /* Balance card */
        .shop-balance-card {
          background: linear-gradient(135deg, #f0f4f8 0%, #ffffff 100%);
          border-radius: 18px;
          padding: 24px; /* min p-6 */
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 113, 206, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .balance-info-col {
          display: flex;
          flex-direction: column;
        }

        .balance-amount-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--primary-color);
          letter-spacing: -0.5px;
        }

        .balance-sub-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .add-balance-btn {
          width: 48px; /* h-12 touch target */
          height: 48px;
          background-color: var(--primary-color);
          color: white;
          border-radius: 14px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 113, 206, 0.25);
          transition: all 0.2s;
        }

        .add-balance-btn:hover {
          transform: translateY(-1.5px) scale(1.03);
          background-color: var(--primary-hover);
        }

        .add-balance-btn:active {
          transform: translateY(1px);
        }

        /* Standalone task stats card */
        .matching-stats-card {
          background-color: var(--bg-card);
          border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.04);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          padding: 24px; /* min p-6 */
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stats-card-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .stats-card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          text-align: center;
        }

        .stats-card-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stats-card-col:not(:last-child) {
          border-right: 1px solid rgba(0, 0, 0, 0.04);
        }

        .stats-card-num {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary-color);
        }

        .stats-card-lbl {
          font-size: 11px;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-weight: 600;
        }

        /* Match visual slot machine styles */
        .matching-visual-box {
          margin: 8px 0;
        }

        /* Begin matching button */
        .begin-match-btn {
          width: 100%;
          height: 52px;
          border-radius: 26px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          border: none;
          box-shadow: 0 8px 20px -4px rgba(3, 105, 161, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          isolation: isolate;
          cursor: pointer;
        }

        .begin-match-btn-label {
          position: relative;
          z-index: 1;
          color: #fff;
          -webkit-text-fill-color: #fff;
        }

        .begin-match-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          transition: all 0.75s ease;
        }

        .begin-match-btn:not(.disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -4px rgba(3, 105, 161, 0.5);
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        }

        .begin-match-btn:not(.disabled):hover::before {
          left: 125%;
        }

        .begin-match-btn.disabled {
          background: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
          border: 1px solid rgba(0, 0, 0, 0.03);
        }

        /* Stats Grid card */
        .stats-report-card {
          background-color: var(--bg-card);
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.03);
        }

        .report-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 12px;
        }

        .report-item {
          display: flex;
          flex-direction: column;
          padding: 8px 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.015);
          border: 1px solid rgba(0,0,0,0.02);
        }

        .report-val {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
        }

        .report-lbl {
          font-size: 9px;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-weight: 600;
        }

        /* Store rules */
        .store-rules-container {
          background-color: var(--bg-card);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          margin-bottom: 16px;
          border: 1px solid rgba(0, 0, 0, 0.03);
        }

        .rules-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rules-list {
          padding-left: 14px;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.6;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      `}</style>
    </>
  );
}
