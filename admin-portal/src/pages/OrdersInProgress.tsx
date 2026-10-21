import React, { useState, useEffect, useRef } from 'react';
import { PRODUCT_CATALOG } from '../data/products';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { 
  ClipboardList, 
  ListOrdered, 
  TrendingUp, 
  LineChart,
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Briefcase,
  Database,
  Eye,
  Info,
  Layers3,
  Sparkles,
  Award,
  Search,
  Filter,
  Package,
  ChevronRight,
  RefreshCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button, Modal, Card, Input, Badge } from '@/src/shared/UI';

const toCents = (value: any) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
};

const rebalanceFollowingPrices = (orders: any[], editedIndex: number, updatedPriceCents: number) => {
  const adjustedOrders = orders.map(order => ({ ...order }));
  const previousPriceCents = toCents(adjustedOrders[editedIndex]?.price);
  if (previousPriceCents === null || updatedPriceCents < 1) return null;

  const deltaCents = updatedPriceCents - previousPriceCents;
  adjustedOrders[editedIndex].price = updatedPriceCents / 100;
  if (deltaCents === 0) return adjustedOrders;

  const followingPendingIndexes = adjustedOrders
    .map((order, index) => ({ order, index }))
    .filter(({ order, index }) => index > editedIndex && order.status === 'Pending')
    .map(({ index }) => index);
  if (followingPendingIndexes.length === 0) return null;

  const oldFollowingTotal = followingPendingIndexes.reduce(
    (sum, index) => sum + (toCents(adjustedOrders[index].price) || 0),
    0
  );
  const newFollowingTotal = oldFollowingTotal - deltaCents;
  if (newFollowingTotal < followingPendingIndexes.length) return null;

  const weights = followingPendingIndexes.map(index => Math.max(1, toCents(adjustedOrders[index].price) || 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const distributableCents = newFollowingTotal - followingPendingIndexes.length;
  const shares = weights.map(weight => (distributableCents * weight) / totalWeight);
  const allocatedCents = shares.map(share => Math.floor(share));
  const remainingCents = distributableCents - allocatedCents.reduce((sum, amount) => sum + amount, 0);

  const remainderOrder = shares
    .map((share, index) => ({ index, remainder: share - allocatedCents[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; index < remainingCents; index++) {
    allocatedCents[remainderOrder[index].index] += 1;
  }

  followingPendingIndexes.forEach((orderIndex, index) => {
    adjustedOrders[orderIndex].price = (allocatedCents[index] + 1) / 100;
  });
  return adjustedOrders;
};

export default function OrdersInProgress() {
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>(PRODUCT_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');
  const [session, setSession] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'Completed' | 'Pending'>('All');

  // Edit Worksheet Orders Modal state
  const [showEditOrdersModal, setShowEditOrdersModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editingOrders, setEditingOrders] = useState<any[]>([]);
  const lastValidPrices = useRef<number[]>([]);

  const [flashingTaskIds, setFlashingTaskIds] = useState<Record<string, boolean>>({});

  const fetchTasks = async () => {
    try {
      const savedSession = localStorage.getItem('cb_admin_session');
      if (savedSession) {
        setSession(JSON.parse(savedSession));
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('cb_assigned_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tasksError && tasksData) {
        const mappedTasks = tasksData.map(t => ({
          id: t.id,
          userId: t.user_id,
          username: t.username,
          totalAmount: parseFloat(t.total_amount || 0),
          orderCount: t.order_count,
          profitPercent: parseFloat(t.profit_percent || 0),
          status: t.status,
          createdAt: new Date(t.created_at).toLocaleString(),
          assignedBy: t.assigned_by,
          orders: typeof t.orders === 'string' ? JSON.parse(t.orders) : t.orders,
          referred_by_staff_id: t.referred_by_staff_id || 'None',
          member_of_admin_id: t.member_of_admin_id || 'None'
        }));
        setAssignedTasks(mappedTasks);
      }
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  };

  const loadProducts = async () => {
    try {
      let activeProducts = PRODUCT_CATALOG;
      const { data: dbProducts } = await supabase.from('cb_products').select('*');
      if (dbProducts && dbProducts.length > 0) {
        activeProducts = dbProducts.map((p, idx) => ({
          id: p.id || `db-prod-${idx}`,
          title: p.title,
          image: p.image_url || p.image,
          type: p.type || 'gear',
          price: parseFloat(p.price || 0),
          profit: parseFloat(p.profit || 0)
        }));
      }
      setProducts(activeProducts);
    } catch (err) {
      console.error("Error loading products catalog:", err);
    }
  };

  const pendingBatchUpdates = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<any>(null);

  const processBatchUpdates = async () => {
    const taskIdsToUpdate = Array.from(pendingBatchUpdates.current);
    pendingBatchUpdates.current.clear();

    if (taskIdsToUpdate.length === 0) return;

    try {
      const { data: updatedTasks } = await supabase
        .from('cb_assigned_tasks')
        .select('*')
        .in('id', taskIdsToUpdate);

      if (updatedTasks && updatedTasks.length > 0) {
        setAssignedTasks(prevTasks => {
          const map = new Map(prevTasks.map(t => [t.id, t]));
          updatedTasks.forEach(t => {
            map.set(t.id, {
              id: t.id,
              userId: t.user_id,
              username: t.username,
              totalAmount: parseFloat(t.total_amount || 0),
              orderCount: t.order_count,
              profitPercent: parseFloat(t.profit_percent || 0),
              status: t.status,
              createdAt: new Date(t.created_at).toLocaleString(),
              assignedBy: t.assigned_by,
              orders: typeof t.orders === 'string' ? JSON.parse(t.orders) : t.orders,
              referred_by_staff_id: t.referred_by_staff_id || 'None',
              member_of_admin_id: t.member_of_admin_id || 'None'
            });
          });
          return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });

        const newFlashMap: Record<string, boolean> = {};
        taskIdsToUpdate.forEach(id => {
          newFlashMap[id] = true;
        });
        setFlashingTaskIds(prev => ({ ...prev, ...newFlashMap }));
        setTimeout(() => {
          setFlashingTaskIds(prev => {
            const next = { ...prev };
            taskIdsToUpdate.forEach(id => delete next[id]);
            return next;
          });
        }, 1500);
      }
    } catch (err) {
      console.error("Batch update error:", err);
      fetchTasks();
    }
  };

  const queueBatchUpdate = (taskId: string) => {
    pendingBatchUpdates.current.add(taskId);
    if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);
    batchTimeoutRef.current = setTimeout(processBatchUpdates, 150);
  };

  useEffect(() => {
    fetchTasks();
    loadProducts();

    // Realtime channel subscription with debounced batch-update approach
    const channel = supabase
      .channel('admin-orders-in-progress-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_assigned_tasks' }, (payload: any) => {
        const updatedId = payload?.new?.id || payload?.old?.id;
        if (updatedId) queueBatchUpdate(updatedId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cb_orders' }, (payload: any) => {
        const assignedTaskId = payload?.new?.assigned_task_id || payload?.old?.assigned_task_id;
        if (assignedTaskId) queueBatchUpdate(assignedTaskId);
      })
      .subscribe();

    const interval = setInterval(() => {
      if (document.hidden) return; 
      fetchTasks();
    }, 15000); 

    return () => {
      clearInterval(interval);
      if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const getFilteredTasks = () => {
    return assignedTasks.filter(t => {
      if (session?.role === 'Admin') {
        if (t.member_of_admin_id !== session?.accountId) return false;
      } else if (session?.role === 'Staff') {
        if (t.referred_by_staff_id !== session?.accountId) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = t.username.toLowerCase().includes(q) || 
                             t.id.toLowerCase().includes(q) ||
                             t.assignedBy.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (statusFilter !== 'All') {
        if (t.status !== statusFilter) return false;
      }

      return true;
    });
  };

  const handleCancelTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to cancel and delete this assigned task? All pending orders will be removed.")) {
      try {
        const { error: ordersDeleteError } = await supabase
          .from('cb_orders')
          .delete()
          .eq('assigned_task_id', taskId);

        if (ordersDeleteError) {
          toast.error("Error removing linked orders: " + ordersDeleteError.message);
          return;
        }

        const { error: taskDeleteError } = await supabase
          .from('cb_assigned_tasks')
          .delete()
          .eq('id', taskId);

        if (taskDeleteError) {
          toast.error("Error deleting task: " + taskDeleteError.message);
          return;
        }

        toast.success("Task and all linked orders cancelled and deleted successfully.");
        fetchTasks();
      } catch (err: any) {
        toast.error("Failed to delete task: " + err.message);
      }
    }
  };

  const handleOpenEditOrdersModal = (task: any) => {
    setEditingTask(task);
    setEditingOrders(task.orders.map((o: any) => ({
      ...o,
      price: o.price !== undefined ? o.price : 0,
      profit: o.profit !== undefined ? o.profit : 0,
      commission: o.commission !== undefined ? o.commission : parseFloat((Number(o.profit || 0) * 0.1).toFixed(2))
    })));
    lastValidPrices.current = task.orders.map((order: any) => toCents(order.price) || 0);
    setShowEditOrdersModal(true);
  };

  const handlePriceChange = (idx: number, value: any, orderUpdates = {}) => {
    if (editingOrders[idx]?.status === 'Success') return;
    const numVal = parseFloat(value) || 0;
    setEditingOrders(current => current.map((order, index) => {
      if (index === idx) {
        return { 
          ...order, 
          ...orderUpdates, 
          price: value
        };
      }
      return order;
    }));
  };

  const handleRecalculateSubsequentAiOrders = (fromIndex: number) => {
    if (!editingOrders || editingOrders.length <= fromIndex + 1) return;
    const updated = editingOrders.map(o => ({ ...o }));

    // Estimate running balance after order at fromIndex
    const startPrice = parseFloat(updated[fromIndex].price || 0);
    const startProfit = parseFloat(updated[fromIndex].profit || 0);

    // Calculate cumulative profit up to fromIndex
    const priorProfits = updated.slice(0, fromIndex + 1).reduce((sum, o) => sum + (parseFloat(o.profit) || 0), 0);
    
    // User starting balance estimated from task initial amount or current balance
    const userInitialBal = parseFloat(editingTask?.totalAmount || '100');
    let runningBal = userInitialBal + priorProfits;

    for (let i = fromIndex + 1; i < updated.length; i++) {
      if (updated[i].status === 'Pending') {
        const reduction = Math.random() * (37 - 18) + 18; // $18 to $37
        const newPrice = Math.max(10, parseFloat((runningBal - reduction).toFixed(2)));
        const profitRate = 0.002 + Math.random() * (0.003 - 0.002); // 0.2% to 0.3%
        const newProfit = parseFloat((newPrice * profitRate).toFixed(2));
        const newComm = parseFloat((newProfit * 0.1).toFixed(2));

        updated[i].price = newPrice.toFixed(2);
        updated[i].profit = newProfit.toFixed(2);
        updated[i].commission = newComm.toFixed(2);

        runningBal = parseFloat((runningBal + newProfit).toFixed(2));
      }
    }

    setEditingOrders(updated);
    toast.success(`Recalculated AI Edge sequence for rows #${fromIndex + 2} to #${updated.length}`);
  };

  const handleSaveEditedOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    for (let idx = 0; idx < editingOrders.length; idx++) {
      const o = editingOrders[idx];
      const pPrice = parseFloat(o.price);
      const pProfit = parseFloat(o.profit);
      const pComm = parseFloat(o.commission !== undefined ? o.commission : 0);
      if (isNaN(pPrice) || pPrice < 0 || isNaN(pProfit) || pProfit < 0 || isNaN(pComm) || pComm < 0) {
        toast.error(`Order #${idx + 1} has invalid price, profit, or commission.`);
        return;
      }
    }

    try {
      const cleanedOrders = editingOrders.map(o => ({
        ...o,
        price: parseFloat(parseFloat(o.price || 0).toFixed(2)),
        profit: parseFloat(parseFloat(o.profit || 0).toFixed(2)),
        commission: parseFloat(parseFloat(o.commission || 0).toFixed(2))
      }));

      const newTotalAmount = parseFloat(cleanedOrders.reduce((sum, o) => sum + parseFloat(o.price || 0), 0).toFixed(2));
      const newTotalProfit = parseFloat(cleanedOrders.reduce((sum, o) => sum + parseFloat(o.profit || 0), 0).toFixed(2));
      const newProfitPercent = newTotalAmount > 0 ? parseFloat(((newTotalProfit / newTotalAmount) * 100).toFixed(2)) : 0;

      const { error: taskErr } = await supabase
        .from('cb_assigned_tasks')
        .update({ 
          orders: cleanedOrders,
          total_amount: newTotalAmount,
          profit_percent: newProfitPercent
        })
        .eq('id', editingTask.id);

      if (taskErr) {
        toast.error("Error updating worksheet orders in task: " + taskErr.message);
        return;
      }

      for (let idx = 0; idx < cleanedOrders.length; idx++) {
        const o = cleanedOrders[idx];
        const { error: orderErr } = await supabase
          .from('cb_orders')
          .update({
            title: o.title,
            image: o.image || null,
            price: o.price,
            profit: o.profit,
            status: o.status
          })
          .eq('assigned_task_id', editingTask.id)
          .eq('assigned_order_index', idx);
        if (orderErr) {
          console.warn(`Order #${idx + 1} sync warning: ${orderErr.message}`);
        }
      }

      toast.success("Worksheet sequence changes committed successfully!");
      setShowEditOrdersModal(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err: any) {
      toast.error("Failed to commit sequence changes: " + err.message);
    }
  };

  const filteredTasks = getFilteredTasks();
  const inProgressCount = assignedTasks.filter(t => t.status === 'In Progress').length;
  const completedTaskCount = assignedTasks.filter(t => t.status === 'Completed').length;
  const totalVolume = assignedTasks.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const canAdjustPrices = true;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <LineChart className="w-6 h-6 text-indigo-500" />
              Orders In Progress & Worksheets
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Monitor real-time worksheet sequences, track client progress, and modify allocated orders.
            </p>
          </div>
          
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            {['All', 'In Progress', 'Completed', 'Pending'].map((tab) => (
              <button 
                key={tab}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${statusFilter === tab ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setStatusFilter(tab as any)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: assignedTasks.length, icon: ClipboardList, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-500/10' },
          { label: 'In Progress', value: inProgressCount, icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Completed', value: completedTaskCount, icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Volume', value: `$${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' }
        ].map((kpi, idx) => (
          <Card key={idx} className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{kpi.label}</span>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none">{kpi.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search username, task ID, or admin node..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
          />
        </div>
      </Card>

      {/* Task Tracker Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Progress</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Yield</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium text-xs">
                    No active worksheets found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => {
                  const completedCount = t.orders ? t.orders.filter((o: any) => o.status === 'Success').length : 0;
                  const totalOrders = t.orderCount || (t.orders ? t.orders.length : 1);
                  const progressPct = Math.round((completedCount / totalOrders) * 100);
                  const isCompleted = t.status === 'Completed';
                  const isInProgress = t.status === 'In Progress';
                  
                  const isFlashing = flashingTaskIds[t.id];
                  
                  return (
                    <tr key={t.id} className={`transition-all duration-700 ${isFlashing ? 'animate-pulse-flash bg-emerald-100 dark:bg-emerald-950/85 shadow-lg transform scale-[1.005] border-l-4 border-emerald-500' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30'}`}>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] font-bold text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10">#{t.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                            {t.username.substring(0,2)}
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.username}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Node: {t.referred_by_staff_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">{completedCount} / {totalOrders} Completed</span>
                            <span className="text-indigo-600">{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-amber-500' : 'bg-indigo-600'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white tracking-tight">
                          ${t.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="success" className="text-[9px] font-black py-0 px-2 uppercase tracking-widest">+{t.profitPercent}%</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge 
                          variant={isCompleted ? 'success' : isInProgress ? 'warning' : 'neutral'}
                          className="text-[9px] font-black py-0 px-2 uppercase"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {t.status !== 'Completed' ? (
                            <>
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-8 px-3 text-[10px] font-black"
                                onClick={() => handleOpenEditOrdersModal(t)}
                              >
                                EDIT
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                className="h-8 px-3 text-[10px] font-black"
                                onClick={() => handleCancelTask(t.id)}
                              >
                                CANCEL
                              </Button>
                            </>
                          ) : (
                            <div className="h-8 flex items-center px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                              Archive
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Sequence Modal */}
      {showEditOrdersModal && editingTask && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-6 transition-all">
          <div className="bg-white dark:bg-slate-950 w-full max-w-6xl h-[92dvh] max-h-[920px] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden my-auto animate-in zoom-in-95 fade-in duration-200">
            {/* Modal Header */}
            <div className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs border border-indigo-500/20 shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight flex items-center gap-2">
                    <span>Worksheet Sequence Manager</span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">#{editingTask.id}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Modifying {editingOrders.length} sequence items for <span className="font-bold text-slate-700 dark:text-slate-200">{editingTask.username}</span>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                onClick={() => { setShowEditOrdersModal(false); setEditingTask(null); }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info and Action Bar */}
            <div className="px-6 py-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200 flex-shrink-0">
              <div className="flex items-center gap-2 font-medium">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Edit price or profit of any row. You can click <strong>Recalculate AI Edge Formula</strong> on any row to automatically recalculate subsequent pending items.</span>
              </div>
            </div>

            {/* Modal Body - Compact Sticky Header Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 bg-slate-50/30 dark:bg-slate-950/30">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3.5 w-16 text-center">Row</th>
                      <th className="px-4 py-3.5 w-28 text-center">Status</th>
                      <th className="px-4 py-3.5 min-w-[220px]">Product Info</th>
                      <th className="px-4 py-3.5 w-36 text-right">Price ($)</th>
                      <th className="px-4 py-3.5 w-36 text-right">Profit ($)</th>
                      <th className="px-4 py-3.5 w-36 text-right">Commission ($)</th>
                      <th className="px-4 py-3.5 w-36 text-center">AI Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {editingOrders.map((order: any, idx: number) => {
                      const isCompleted = order.status === 'Success';
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/80 dark:hover:bg-slate-950/60 transition-colors ${isCompleted ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-70' : ''}`}>
                          <td className="px-4 py-3 text-center align-middle font-mono font-bold text-xs text-slate-500">
                            #{idx + 1}
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                            <select
                              value={order.status}
                              onChange={(e) => {
                                const newOrders = [...editingOrders];
                                newOrders[idx].status = e.target.value;
                                setEditingOrders(newOrders);
                              }}
                              className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                                isCompleted 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Success">Success</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-3">
                              {order.image ? (
                                <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs">
                                  <img src={order.image} alt="" className="max-w-full max-h-full object-contain" />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                              <input 
                                type="text"
                                value={order.title}
                                onChange={(e) => {
                                  const newOrders = [...editingOrders];
                                  newOrders[idx].title = e.target.value;
                                  setEditingOrders(newOrders);
                                }}
                                disabled={isCompleted}
                                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-middle">
                            <input 
                              type="number"
                              step="0.01"
                              value={order.price}
                              onChange={(e) => handlePriceChange(idx, e.target.value)}
                              disabled={isCompleted}
                              className="w-28 h-9 px-3 text-right font-mono text-xs font-extrabold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                            />
                          </td>
                          <td className="px-4 py-3 text-right align-middle">
                            <input 
                              type="number"
                              step="0.01"
                              value={order.profit}
                              onChange={(e) => {
                                const newOrders = [...editingOrders];
                                newOrders[idx].profit = e.target.value;
                                setEditingOrders(newOrders);
                              }}
                              disabled={isCompleted}
                              className="w-28 h-9 px-3 text-right font-mono text-xs font-extrabold rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                            />
                          </td>
                          <td className="px-4 py-3 text-right align-middle">
                            <input 
                              type="number"
                              step="0.01"
                              value={order.commission !== undefined ? order.commission : (parseFloat((Number(order.profit || 0) * 0.1).toFixed(2)))}
                              onChange={(e) => {
                                const newOrders = [...editingOrders];
                                newOrders[idx].commission = e.target.value;
                                setEditingOrders(newOrders);
                              }}
                              disabled={isCompleted}
                              className="w-28 h-9 px-3 text-right font-mono text-xs font-extrabold rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                            />
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                            {!isCompleted && idx < editingOrders.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleRecalculateSubsequentAiOrders(idx)}
                                title={`Recalculate rows #${idx + 2} to #${editingOrders.length} using AI Edge balance formula`}
                                className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold border border-purple-200 dark:border-purple-800 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                                <span>Cascade AI</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Summary */}
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-center sm:text-left">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Amount</span>
                  <span className="text-base font-mono font-black text-white">
                    ${editingOrders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Total Profit</span>
                  <span className="text-base font-mono font-black text-emerald-400">
                    ${editingOrders.reduce((sum, o) => sum + (parseFloat(o.profit) || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">Total Commission</span>
                  <span className="text-base font-mono font-black text-indigo-400">
                    ${editingOrders.reduce((sum, o) => sum + (parseFloat(o.commission || 0) || (parseFloat(o.profit || 0) * 0.1)), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  type="button"
                  className="px-5 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  onClick={() => { setShowEditOrdersModal(false); setEditingTask(null); }}
                >
                  Discard Changes
                </button>
                <button 
                  type="button"
                  onClick={handleSaveEditedOrders}
                  className="px-6 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Save Worksheet Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
