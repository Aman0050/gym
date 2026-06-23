import React, { useState, useEffect } from 'react';
import { expenseService } from '../../services/expenseService';
import { operationsReportService } from '../../services/operationsReportService';
import { generateReportPDF } from '../../utils/reportPDFGenerator';
import {
  Plus, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  TrendingDown, Calendar, AlertCircle, Trash2, Edit, FileText, CheckCircle, Clock, X,
  Download, Eye, BarChart3, Receipt, Wallet, Layers, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const CHART_COLORS = ['#a0522d', '#e2725b', '#d2b48c', '#8b4513', '#475569', '#1e293b', '#64748b'];

const Expenses = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics'
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [kpis, setKpis] = useState({
    totalExpensesAllTime: 0,
    currentMonthRevenue: 0,
    currentMonthExpenses: 0,
    currentMonthProfit: 0,
    pendingExpenses: 0,
    topCategory: 'None'
  });
  const [analyticsData, setAnalyticsData] = useState({ trends: [], categoryBreakdown: [] });

  // Pagination & Filters State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    status: 'Paid'
  });
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState('');

  // Audit Logs State (For Premium Audit Feature)
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Load Categories & Analytics on mount
  useEffect(() => {
    fetchCategories();
    fetchAnalytics();
  }, []);

  // Reload expenses on filter or sorting change
  useEffect(() => {
    fetchExpenses();
  }, [page, search, categoryFilter, statusFilter, paymentFilter, startDate, endDate, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const data = await expenseService.getExpenseCategories();
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  const fetchExpenses = async () => {
    try {
      const data = await expenseService.getExpenses({
        page,
        limit,
        search,
        category: categoryFilter,
        status: statusFilter,
        payment_method: paymentFilter,
        startDate,
        endDate,
        sortBy,
        sortOrder
      });
      setExpenses(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load expenses');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await operationsReportService.getProfitAnalytics();
      setKpis(data.kpis);
      setAnalyticsData({
        trends: data.trends,
        categoryBreakdown: data.categoryBreakdown
      });
    } catch (err) {
      toast.error('Failed to load profit analytics');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await operationsReportService.getAuditLogs({ entity_type: 'EXPENSE', limit: 20 });
      setAuditLogs(data);
    } catch (err) {
      toast.error('Failed to load audit trail');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size cannot exceed 5MB');
        return;
      }
      setInvoiceFile(file);
      const url = URL.createObjectURL(file);
      setInvoicePreview(url);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedExpense(null);
    setFormData({
      title: '',
      description: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      status: 'Paid'
    });
    setInvoiceFile(null);
    setInvoicePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || '',
      category_id: expense.category_id,
      amount: expense.amount,
      expense_date: new Date(expense.expense_date).toISOString().split('T')[0],
      payment_method: expense.payment_method,
      status: expense.status
    });
    setInvoiceFile(null);
    setInvoicePreview(expense.invoice_url ? `${import.meta.env.VITE_API_URL}${expense.invoice_url}` : '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (invoiceFile) {
      data.append('invoice', invoiceFile);
    }

    try {
      if (selectedExpense) {
        await expenseService.updateExpense(selectedExpense.id, data);
        toast.success('Expense updated successfully');
      } else {
        await expenseService.createExpense(data);
        toast.success('Expense recorded successfully');
      }
      setIsModalOpen(false);
      fetchExpenses();
      fetchAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this record? This action will be audited.')) {
      try {
        await expenseService.deleteExpense(id);
        toast.success('Expense record deleted');
        fetchExpenses();
        fetchAnalytics();
      } catch (err) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const triggerExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'exporting' });
      await operationsReportService.exportData('expenses', format);
      toast.success('Export downloaded successfully', { id: 'exporting' });
    } catch (err) {
      toast.error('Failed to export expenses report', { id: 'exporting' });
    }
  };

  const handleGeneratePDFReport = () => {
    const headers = ['Expense No', 'Title', 'Category', 'Amount', 'Date', 'Payment', 'Status'];
    const tableData = expenses.map(e => [
      e.expense_number,
      e.title,
      e.category_name,
      `INR ${Number(e.amount).toLocaleString('en-IN')}`,
      new Date(e.expense_date).toLocaleDateString('en-IN'),
      e.payment_method,
      e.status
    ]);
    generateReportPDF('Expenses List', headers, tableData);
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setPaymentFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(col);
      setSortOrder('DESC');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-meta">
          <h1 className="page-title text-white">Expense & Profits</h1>
          <p className="body-text">Monitor spending categories, manage bills, and track monthly net profit trends.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-earth-clay/40 text-slate-300 font-semibold text-xs transition flex items-center gap-2"
            >
              <Download size={14} />
              EXPORT
            </button>
            <AnimatePresence>
              {isExportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-40 rounded-xl bg-[#080808]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl z-20 py-1.5 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        triggerExport('xlsx');
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
                    >
                      Export Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerExport('csv');
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
                    >
                      Export CSV (.csv)
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs shadow-lg shadow-earth-clay/20 transition flex items-center gap-2"
          >
            <Plus size={14} />
            Record Expense
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="aura-glass p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-earth-clay/10 flex items-center justify-center text-earth-clay">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Expenses</p>
            <h4 className="text-xl font-bold text-white mt-1">₹{Number(kpis.totalExpensesAllTime).toLocaleString('en-IN')}</h4>
          </div>
        </div>

        <div className="aura-glass p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <TrendingDown size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">This Month Expenses</p>
            <h4 className="text-xl font-bold text-white mt-1">₹{Number(kpis.currentMonthExpenses).toLocaleString('en-IN')}</h4>
          </div>
        </div>

        <div className="aura-glass p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pending Bills</p>
            <h4 className="text-xl font-bold text-white mt-1">₹{Number(kpis.pendingExpenses).toLocaleString('en-IN')}</h4>
          </div>
        </div>

        <div className="aura-glass p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Top Spending Category</p>
            <h4 className="text-md font-bold text-white mt-1.5 truncate max-w-[150px]">{kpis.topCategory}</h4>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/[0.06] gap-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-4 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'list' ? 'border-b-2 border-earth-clay text-earth-clay' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Expenses List
        </button>
        <button
          onClick={() => {
            setActiveTab('analytics');
            fetchAnalytics();
          }}
          className={`pb-4 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'analytics' ? 'border-b-2 border-earth-clay text-earth-clay' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Profit Analytics
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {showAuditLogs && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="aura-glass p-6 border border-amber-500/20 bg-amber-500/[0.01]"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-amber-500">System Audit Trail (Recent Activity)</h4>
              <button onClick={() => setShowAuditLogs(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto premium-scrollbar pr-2">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500">No recent operational changes recorded.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-xs flex items-center justify-between border-b border-white/[0.03] pb-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black mr-2 ${
                        log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.action === 'UPDATE' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                      }`}>{log.action}</span>
                      <span className="text-slate-300 font-bold">{log.entity_type} record modified</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">By {log.creator_email || 'System'} | ID: {log.record_id.substring(0, 8)}</p>
                    </div>
                    <span className="text-[10px] text-slate-600">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Filter Dashboard */}
            <div className="aura-glass p-5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 flex-1 min-w-0">
                {/* Search */}
                <div className="relative w-full max-w-[240px]">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search expenses..."
                    className="input-field !pl-10 !py-2 text-xs"
                  />
                </div>
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[150px]"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[130px]"
                >
                  <option value="">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {/* Reset Filters */}
                {(search || categoryFilter || statusFilter || startDate || endDate) && (
                  <button
                    onClick={resetFilters}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
                    title="Reset Filters"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerExport('xlsx')}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-earth-clay/35 text-slate-300 font-semibold text-xs transition"
                  title="Export to Excel"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={handleGeneratePDFReport}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-earth-clay/35 text-slate-300 font-semibold text-xs transition"
                  title="Export to PDF"
                >
                  <FileText size={14} />
                </button>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="aura-glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('expense_number')}>
                        Expense No <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('title')}>
                        Title <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5">Category</th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('amount')}>
                        Amount <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('expense_date')}>
                        Date <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5">Payment</th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('status')}>
                        Status <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs font-medium text-slate-300">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-10 text-center text-slate-500">No expenses recorded matching the filters.</td>
                      </tr>
                    ) : (
                      expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-5 font-mono text-[11px] text-slate-400">{expense.expense_number}</td>
                          <td className="p-5 font-bold text-white">{expense.title}</td>
                          <td className="p-5">
                            <span className="px-2 py-1 rounded-lg bg-white/[0.04] text-slate-300">{expense.category_name}</span>
                          </td>
                          <td className="p-5 font-bold text-white">₹{Number(expense.amount).toLocaleString('en-IN')}</td>
                          <td className="p-5">{new Date(expense.expense_date).toLocaleDateString('en-IN')}</td>
                          <td className="p-5">{expense.payment_method}</td>
                          <td className="p-5">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                              expense.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' :
                              expense.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {expense.status}
                            </span>
                          </td>
                          <td className="p-5 text-right flex items-center justify-end gap-2">
                            {expense.invoice_url && (
                              <a
                                href={`${import.meta.env.VITE_API_URL}${expense.invoice_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-white/[0.03] hover:bg-earth-clay/10 text-slate-400 hover:text-earth-clay transition"
                                title="View Bill"
                              >
                                <Eye size={13} />
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(expense)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition"
                              title="Edit"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Showing page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white disabled:opacity-40 transition"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white disabled:opacity-40 transition"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Monthly Trend Chart */}
            <div className="aura-glass p-6 lg:col-span-2 space-y-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Monthly Profit & Loss Trend</h4>
                <p className="text-[11px] text-slate-500 font-medium">Comparison of monthly subscription payments vs recorded expenses.</p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="aura-glass p-6 space-y-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Expense Categories (This Month)</h4>
                <p className="text-[11px] text-slate-500 font-medium">Spending breakdown distribution.</p>
              </div>
              <div className="h-[220px] flex justify-center items-center">
                {analyticsData.categoryBreakdown.length === 0 || analyticsData.categoryBreakdown.every(x => x.amount === 0) ? (
                  <p className="text-xs text-slate-500">No expenses recorded for this month.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.categoryBreakdown.filter(x => x.amount > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {analyticsData.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} contentStyle={{ background: '#080808', borderColor: 'rgba(255,255,255,0.08)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Legend list */}
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto premium-scrollbar text-[11px]">
                {analyticsData.categoryBreakdown.filter(x => x.amount > 0).map((item, idx) => (
                  <div key={item.category} className="flex justify-between items-center pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="text-slate-400 font-medium">{item.category}</span>
                    </div>
                    <span className="font-bold text-white">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record/Edit Expense Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[500px] aura-glass-heavy p-8 z-10 overflow-hidden max-h-[90vh] overflow-y-auto premium-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase text-white tracking-widest">
                  {selectedExpense ? 'Modify Expense' : 'Record Expense'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter expense title (e.g. Electricity Bill June)"
                    className="input-field text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Category</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="select-field text-xs !py-3"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Amount (INR)</label>
                    <input
                      type="number"
                      name="amount"
                      required
                      min="0"
                      step="100"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Expense Date</label>
                    <input
                      type="date"
                      name="expense_date"
                      required
                      value={formData.expense_date}
                      onChange={handleInputChange}
                      className="input-field text-xs !py-[9px]"
                    />
                  </div>
                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="select-field text-xs !py-3"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Payment Method</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className="select-field text-xs !py-3"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter additional details/notes..."
                    className="input-field text-xs resize-none"
                  />
                </div>

                {/* Invoice Upload */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Upload Bill / Invoice (PDF, PNG, JPG - Max 5MB)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:uppercase file:bg-earth-clay/10 file:text-earth-clay hover:file:bg-earth-clay/20 cursor-pointer"
                  />
                  {invoicePreview && (
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <span>Invoice Attached / Preview Available</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs shadow-lg shadow-earth-clay/25 transition"
                  >
                    {selectedExpense ? 'Update Record' : 'Record Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
