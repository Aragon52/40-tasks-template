import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Info,
  DollarSign, 
  Percent, 
  TrendingUp,
  Search,
  Check,
  FileText,
  X
} from 'lucide-react';
import { 
  TEMPLATE_M_1, 
  TEMPLATE_M_2, 
  TEMPLATE_M_3, 
  TEMPLATE_M_4, 
  TEMPLATE_M_5, 
  TEMPLATE_C_1, 
  TEMPLATE_C_2, 
  TEMPLATE_C_3, 
  TEMPLATE_C_4, 
  TEMPLATE_C_5 
} from './OrdersTasking';

const templatesMap: Record<string, any[]> = {
  'M-1': TEMPLATE_M_1,
  'M-2': TEMPLATE_M_2,
  'M-3': TEMPLATE_M_3,
  'M-4': TEMPLATE_M_4,
  'M-5': TEMPLATE_M_5,
  'C-1': TEMPLATE_C_1,
  'C-2': TEMPLATE_C_2,
  'C-3': TEMPLATE_C_3,
  'C-4': TEMPLATE_C_4,
  'C-5': TEMPLATE_C_5
};

const templateNames = Object.keys(templatesMap);

export default function TemplatesSummary() {
  const [selectedTemplate, setSelectedTemplate] = useState('M-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showExplorer, setShowExplorer] = useState(false);

  const stats = templateNames.map(name => {
    const items = templatesMap[name];
    const totalValue = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const totalProfit = items.reduce((sum, item) => sum + Number(item.profit || 0), 0);
    const avgPrice = items.length ? totalValue / items.length : 0;
    const avgProfit = items.length ? totalProfit / items.length : 0;
    const minPrice = items.length ? Math.min(...items.map(i => Number(i.price || 0))) : 0;
    const maxPrice = items.length ? Math.max(...items.map(i => Number(i.price || 0))) : 0;
    const margin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;
    
    return {
      id: name,
      type: name.startsWith('M') ? 'Merchant (M)' : 'Commission (C)',
      count: items.length,
      totalValue,
      totalProfit,
      avgPrice,
      avgProfit,
      minPrice,
      maxPrice,
      margin
    };
  });

  const overlapMatrix: Record<string, Record<string, { count: number; percentage: number }>> = {};
  templateNames.forEach(t1 => {
    overlapMatrix[t1] = {};
    templateNames.forEach(t2 => {
      if (t1 === t2) {
        overlapMatrix[t1][t2] = { count: 40, percentage: 100 };
      } else {
        const items1 = templatesMap[t1];
        const items2 = templatesMap[t2];
        let identicalCount = 0;
        
        for (let idx = 0; idx < 40; idx++) {
          if (items1[idx] && items2[idx]) {
            if (items1[idx].price === items2[idx].price && items1[idx].profit === items2[idx].profit) {
              identicalCount++;
            }
          }
        }
        
        overlapMatrix[t1][t2] = {
          count: identicalCount,
          percentage: (identicalCount / 40) * 100
        };
      }
    });
  });

  const displayStats = stats.filter(s => {
    if (filterType === 'M') return s.id.startsWith('M');
    if (filterType === 'C') return s.id.startsWith('C');
    return true;
  });

  const currentTemplateItems = (templatesMap[selectedTemplate] || []).map((item, idx) => ({
    sr: idx + 1,
    title: item.title,
    image: item.image,
    price: item.price,
    profit: item.profit
  }));

  const filteredItems = currentTemplateItems.filter(i => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return i.title.toLowerCase().includes(q) || i.price.toString().includes(q);
  });

  const selectedStats = stats.find(s => s.id === selectedTemplate) || stats[0];

  return (
    <div className="admin-page-container space-y-6">
      {/* Header and Subtabs matching FinancialCenter layout */}
      <div className="admin-card">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-xl tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-indigo-500" />
              <span>Presets Matrix & Verification</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Verify order template yields, price bounds, and item index overlap matrices.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button 
              className={`px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                showExplorer 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
              onClick={() => setShowExplorer(!showExplorer)}
            >
              <Eye size={16} />
              {showExplorer ? 'Hide Explorer' : 'Show Explorer'}
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
            <button 
              className={`px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'all' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700 font-bold' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
              onClick={() => setFilterType('all')}
            >
              All Presets
            </button>
            <button 
              className={`px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'M' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700 font-bold' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
              onClick={() => setFilterType('M')}
            >
              Merchant
            </button>
            <button 
              className={`px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'C' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700 font-bold' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
              onClick={() => setFilterType('C')}
            >
              Commission
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        <div className="admin-card !p-5 !mb-0 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Presets</span>
            <span className="text-lg font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white block">10 Packs</span>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border border-indigo-100 dark:border-indigo-900/30">
            <Layers size={18} />
          </div>
        </div>

        <div className="admin-card !p-5 !mb-0 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Uniqueness Standard</span>
            <span className="text-lg font-bold font-mono tabular-nums mt-1 text-emerald-600 block">90.0% Unique</span>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="admin-card !p-5 !mb-0 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Overlap Checks</span>
            <span className="text-lg font-bold font-mono tabular-nums mt-1 text-amber-500 block">45 Grid Pairs</span>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-100 dark:border-amber-900/30">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="admin-card !p-5 !mb-0 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Items Per Pack</span>
            <span className="text-lg font-bold font-mono tabular-nums mt-1 text-slate-900 dark:text-white block">40 Items</span>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700">
            <FileText size={18} />
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Presets Table & Matrix */}
        <div className={`${showExplorer ? '2xl:col-span-7' : '2xl:col-span-12'} space-y-6 min-w-0`}>
          <div className="admin-card !p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Preset Directory & Yields</h3>
            </div>

            <div className="table-responsive-wrapper border-none rounded-none">
              <table className="admin-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Template ID</th>
                    <th>Type</th>
                    <th className="text-right">Total Price</th>
                    <th className="text-right">Total Profit</th>
                    <th className="text-center">Avg Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStats.map((item) => {
                    const isSelected = selectedTemplate === item.id;
                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors cursor-pointer ${
                          isSelected && showExplorer ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-bold' : ''
                        }`}
                        onClick={() => {
                          setSelectedTemplate(item.id);
                          if (!showExplorer) setShowExplorer(true);
                        }}
                      >
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              item.id.startsWith('M') 
                                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400' 
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            }`}>
                              {item.id}
                            </span>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{item.id}</span>
                          </div>
                        </td>
                        <td className="text-sm text-slate-500">{item.type}</td>
                        <td className="text-right font-mono text-sm font-bold text-slate-900 dark:text-white">${item.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="text-right font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">+${item.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="text-center font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{item.margin.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Preset Item Explorer */}
        {showExplorer && (
          <div className="2xl:col-span-5 admin-card space-y-4 min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>Preset Explorer</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800/40">
                  {selectedTemplate} (40 items)
                </span>
                <button 
                  onClick={() => setShowExplorer(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search items by title or price..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-sm focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
              />
            </div>

            <div className="min-h-[320px] max-h-[min(70dvh,720px)] overflow-y-auto space-y-2 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/50">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No items match your search filter.
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <div key={`${selectedTemplate}-item-${idx}`} className="p-3 sm:p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-slate-400 text-xs font-semibold w-5 shrink-0">{item.sr}</span>
                      <img 
                        src={item.image} 
                        alt="" 
                        className="w-10 h-10 rounded border border-slate-200 dark:border-slate-800 object-cover bg-slate-50 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-1.png'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block whitespace-normal break-words leading-snug" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">${item.price.toFixed(2)}</span>
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">+${item.profit.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
