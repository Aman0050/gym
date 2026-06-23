import React, { useState, useEffect } from 'react';
import { operationsReportService } from '../../services/operationsReportService';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Package, AlertCircle, Wrench, Users,
  Activity, ArrowRight, Download, RefreshCw, Eye
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#a0522d', '#e2725b', '#d2b48c', '#8b4513', '#475569', '#1e293b', '#64748b'];

const OperationsOverview = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const res = await operationsReportService.getOverview();
      setData(res);
    } catch (err) {
      toast.error('Failed to load operations overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const triggerSectionExport = async (section, format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'exporting' });
      await operationsReportService.exportData(section, format);
      toast.success(`${section.toUpperCase()} export downloaded`, { id: 'exporting' });
    } catch (err) {
      toast.error(`Failed to export ${section} report`, { id: 'exporting' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-earth-clay" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Syncing Command Center...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="aura-glass p-8 text-center text-slate-500">
        Failed to fetch operations overview dataset.
      </div>
    );
  }

  const { kpis, charts, activityFeed } = data;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="page-header-meta">
          <h1 className="page-title text-white">Operations Hub</h1>
          <p className="body-text">Enterprise SaaS command center for gym revenues, expenses, stocks, assets, and personnel.</p>
        </div>
        <button
          onClick={fetchOverviewData}
          className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-earth-clay/40 text-slate-300 font-semibold text-xs transition flex items-center gap-2"
        >
          <RefreshCw size={12} />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Financial Panel */}
        <div className="aura-glass p-5 relative overflow-hidden group space-y-3">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-earth-clay/10 flex items-center justify-center text-earth-clay">
              <DollarSign size={18} />
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${
              kpis.financials.expenseGrowthRate <= 0 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {kpis.financials.expenseGrowthRate <= 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
              {Math.abs(kpis.financials.expenseGrowthRate).toFixed(1)}%
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Net Monthly Profit</p>
            <h3 className="text-lg font-bold text-white mt-1">₹{Number(kpis.financials.currentMonthProfit).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-500 font-medium mt-1">
              Rev: ₹{Number(kpis.financials.currentMonthRevenue).toLocaleString('en-IN')} | Exp: ₹{Number(kpis.financials.currentMonthExpenses).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Collections Panel */}
        <div className="aura-glass p-5 relative overflow-hidden group space-y-3">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              {kpis.revenues.collectionRatio.toFixed(0)}% CR
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Unpaid / Pending</p>
            <h3 className="text-lg font-bold text-white mt-1">₹{Number(kpis.revenues.pendingPaymentsAmount).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-500 font-medium mt-1">
              Count: {kpis.revenues.pendingPaymentsCount} pending invoices
            </p>
          </div>
        </div>

        {/* Stock Inventory Panel */}
        <div className="aura-glass p-5 relative overflow-hidden group space-y-3">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Package size={18} />
            </div>
            {kpis.inventory.lowStockCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500/10 text-red-400 flex items-center gap-1">
                <AlertCircle size={10} />
                {kpis.inventory.lowStockCount} Low
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Inventory Value</p>
            <h3 className="text-lg font-bold text-white mt-1">₹{Number(kpis.inventory.totalValue).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-500 font-medium mt-1">
              Out of Stock items: {kpis.inventory.outOfStockCount}
            </p>
          </div>
        </div>

        {/* Machinery Panel */}
        <div className="aura-glass p-5 relative overflow-hidden group space-y-3">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Wrench size={18} />
            </div>
            {kpis.equipment.servicingDueCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                {kpis.equipment.servicingDueCount} Due
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Asset Machinery</p>
            <h3 className="text-lg font-bold text-white mt-1">₹{Number(kpis.equipment.totalValue).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-500 font-medium mt-1">
              Active: {kpis.equipment.activeCount} | Repair: {kpis.equipment.maintenanceCount}
            </p>
          </div>
        </div>

        {/* Staff Headcount Panel */}
        <div className="aura-glass p-5 relative overflow-hidden group space-y-3">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-pink-500/10 text-pink-400">
              {kpis.staff.dailyHeadcountPresence} Present
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Payroll Outflow</p>
            <h3 className="text-lg font-bold text-white mt-1">₹{Number(kpis.staff.monthlyPaidSalary).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] text-slate-500 font-medium mt-1">
              Total Active Staff: {kpis.staff.totalCount} members
            </p>
          </div>
        </div>
      </div>

      {/* Reports Export Section */}
      <div className="aura-glass p-5 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Operations Exporter</h4>
          <p className="text-[10px] text-slate-500 font-medium">Download clean audited spreadsheet sheets for taxes, accounting, or payroll.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {['expenses', 'inventory', 'assets', 'maintenance', 'staff', 'payroll'].map(section => (
            <div key={section} className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden text-xs">
              <span className="px-3 py-1.5 font-bold uppercase tracking-wider text-[9px] text-slate-400">{section === 'assets' ? 'equipment' : section === 'maintenance' ? 'service' : section}</span>
              <button
                onClick={() => triggerSectionExport(section, 'xlsx')}
                className="px-2 py-1.5 border-l border-white/[0.06] hover:bg-white/[0.04] text-slate-300 hover:text-earth-clay transition font-bold text-[9px]"
              >
                XLSX
              </button>
              <button
                onClick={() => triggerSectionExport(section, 'csv')}
                className="px-2 py-1.5 border-l border-white/[0.06] hover:bg-white/[0.04] text-slate-300 hover:text-earth-clay transition font-bold text-[9px]"
              >
                CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main P&L Chart */}
        <div className="aura-glass p-6 lg:col-span-2 space-y-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white">Operational Profit & Loss Analytics</h4>
            <p className="text-[11px] text-slate-500 font-medium">6-Month aggregated trend mapping client memberships payments vs paid business expenses.</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#080808', borderColor: 'rgba(255,255,255,0.08)' }} labelStyle={{ color: '#fff', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Income / Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" name="Expenses Outflow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category breakdown */}
        <div className="aura-glass p-6 space-y-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white">Expense Distribution</h4>
            <p className="text-[11px] text-slate-500 font-medium">Breakdown of this month's spending logs.</p>
          </div>
          <div className="h-[180px] flex justify-center items-center">
            {charts.expenseCategories.length === 0 || charts.expenseCategories.every(x => x.amount === 0) ? (
              <p className="text-xs text-slate-500">No operational expenses logged this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.expenseCategories.filter(x => x.amount > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {charts.expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} contentStyle={{ background: '#080808', borderColor: 'rgba(255,255,255,0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1.5 max-h-[110px] overflow-y-auto premium-scrollbar text-[10px]">
            {charts.expenseCategories.filter(x => x.amount > 0).map((item, idx) => (
              <div key={item.category} className="flex justify-between items-center pr-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="text-slate-400 font-medium">{item.category}</span>
                </div>
                <span className="font-bold text-white">₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Stock Inventory breakdown & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory distribution */}
        <div className="aura-glass p-6 space-y-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white">Inventory Valuation</h4>
            <p className="text-[11px] text-slate-500 font-medium">Value and unit count distribution by item category.</p>
          </div>
          <div className="h-[200px] flex justify-center items-center">
            {charts.inventoryDistribution.length === 0 || charts.inventoryDistribution.every(x => x.value === 0) ? (
              <p className="text-xs text-slate-500">No stock inventory tracked.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.inventoryDistribution.filter(x => x.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="category"
                  >
                    {charts.inventoryDistribution.map((entry, index) => (
                      <Cell key={`cell-inv-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} contentStyle={{ background: '#080808', borderColor: 'rgba(255,255,255,0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-1.5 max-h-[110px] overflow-y-auto premium-scrollbar text-[10px]">
            {charts.inventoryDistribution.filter(x => x.value > 0).map((item, idx) => (
              <div key={item.category} className="flex justify-between items-center pr-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[(idx + 3) % CHART_COLORS.length] }} />
                  <span className="text-slate-400 font-medium">{item.category} ({item.count} units)</span>
                </div>
                <span className="font-bold text-white">₹{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="aura-glass p-6 lg:col-span-2 space-y-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white">Real-Time Operational Log</h4>
            <p className="text-[11px] text-slate-500 font-medium">Live audit events tracking creation, modifications, or deletions in operations.</p>
          </div>
          <div className="space-y-3 max-h-[340px] overflow-y-auto premium-scrollbar pr-2">
            {activityFeed.length === 0 ? (
              <p className="text-xs text-slate-500">No operational audit records logged yet.</p>
            ) : (
              activityFeed.map(log => (
                <div key={log.id} className="text-xs flex items-center justify-between border-b border-white/[0.03] pb-2">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black mr-2 ${
                      log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' :
                      log.action === 'UPDATE' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>{log.action}</span>
                    <span className="text-slate-300 font-bold">{log.entity_type} record modified</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">By {log.creator_email || 'System'} | ID: {log.record_id.substring(0, 8)}</p>
                  </div>
                  <span className="text-[10px] text-slate-600">{new Date(log.created_at).toLocaleTimeString('en-IN')} | {new Date(log.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsOverview;
