import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { generateReportPDF } from '../../utils/reportPDFGenerator';
import { operationsReportService } from '../../services/operationsReportService';
import {
  Plus, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  Trash2, Edit, FileText, CheckCircle, Clock, X,
  Download, Eye, Package, ShieldAlert, BadgeDollarSign, ShoppingCart, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CATEGORIES = ['Supplements', 'Protein', 'Shakers', 'Bottles', 'Merchandise', 'Accessories'];

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'history'
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [dashboard, setDashboard] = useState({
    total_items: 0,
    low_stock: 0,
    out_of_stock: 0,
    inventory_value: 0
  });

  // Table Filters State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('item_name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    item_name: '',
    sku: '',
    category: 'Supplements',
    quantity: 0,
    unit_cost: '',
    selling_price: '',
    minimum_stock: 5
  });

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    type: 'IN', // IN, OUT, ADJUSTMENT
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
  }, [page, search, categoryFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchInventory = async () => {
    try {
      const data = await inventoryService.getInventory({
        page,
        limit,
        search,
        category: categoryFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      setItems(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
      if (data.dashboard) {
        setDashboard(data.dashboard);
      }
    } catch (err) {
      toast.error('Failed to load inventory items');
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await inventoryService.getHistory();
      setHistory(data);
    } catch (err) {
      toast.error('Failed to load transaction history');
    }
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdjustInputChange = (e) => {
    const { name, value } = e.target;
    setAdjustForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setSelectedItem(null);
    setItemForm({
      item_name: '',
      sku: '',
      category: 'Supplements',
      quantity: 0,
      unit_cost: '',
      selling_price: '',
      minimum_stock: 5
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setSelectedItem(item);
    setItemForm({
      item_name: item.item_name,
      sku: item.sku || '',
      category: item.category,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      selling_price: item.selling_price,
      minimum_stock: item.minimum_stock
    });
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await inventoryService.updateItem(selectedItem.id, itemForm);
        toast.success('Inventory item updated');
      } else {
        await inventoryService.createItem(itemForm);
        toast.success('Inventory item created successfully');
      }
      setIsItemModalOpen(false);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Delete this inventory item? All transaction history for this item will be removed.')) {
      try {
        await inventoryService.deleteItem(id);
        toast.success('Inventory item deleted');
        fetchInventory();
      } catch (err) {
        toast.error('Failed to delete inventory item');
      }
    }
  };

  const handleOpenAdjustModal = (item) => {
    setAdjustItem(item);
    setAdjustForm({
      type: 'IN',
      quantity: '',
      notes: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.adjustStock({
        item_id: adjustItem.id,
        type: adjustForm.type,
        quantity: parseFloat(adjustForm.quantity),
        notes: adjustForm.notes
      });
      toast.success('Stock adjusted successfully');
      setIsAdjustModalOpen(false);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const triggerExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'exporting' });
      await operationsReportService.exportData('inventory', format);
      toast.success('Export downloaded successfully', { id: 'exporting' });
    } catch (err) {
      toast.error('Failed to export inventory report', { id: 'exporting' });
    }
  };

  const handleGeneratePDFReport = () => {
    const headers = ['Item Name', 'SKU', 'Category', 'Quantity', 'Unit Cost', 'Selling Price', 'Min Stock', 'Status'];
    const tableData = items.map(i => [
      i.item_name,
      i.sku || '—',
      i.category,
      i.quantity,
      `INR ${Number(i.unit_cost).toLocaleString('en-IN')}`,
      `INR ${Number(i.selling_price).toLocaleString('en-IN')}`,
      i.minimum_stock,
      i.status
    ]);
    generateReportPDF('Inventory Status', headers, tableData);
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(col);
      setSortOrder('ASC');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-meta">
          <h1 className="page-title text-white">Inventory Management</h1>
          <p className="body-text">Track supplement stocks, protein powders, shakers, bottles, and general gym merchandise.</p>
        </div>
        <div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs shadow-lg shadow-earth-clay/20 transition flex items-center gap-2"
          >
            <Plus size={14} />
            Add Stock Item
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="aura-glass p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-earth-clay/10 flex items-center justify-center text-earth-clay">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Items</p>
            <h4 className="text-xl font-bold text-white mt-1">{dashboard.total_items}</h4>
          </div>
        </div>

        <div className="aura-glass p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Low Stock items</p>
            <h4 className="text-xl font-bold text-white mt-1">{dashboard.low_stock}</h4>
          </div>
        </div>

        <div className="aura-glass p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <ShoppingCart size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Out Of Stock</p>
            <h4 className="text-xl font-bold text-white mt-1">{dashboard.out_of_stock}</h4>
          </div>
        </div>

        <div className="aura-glass p-6 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <BadgeDollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Inventory Value</p>
            <h4 className="text-xl font-bold text-white mt-1">₹{Number(dashboard.inventory_value).toLocaleString('en-IN')}</h4>
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
          Inventory List
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-4 text-xs font-black uppercase tracking-wider transition ${
            activeTab === 'history' ? 'border-b-2 border-earth-clay text-earth-clay' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Stock Log History
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
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
                    placeholder="Search stock items..."
                    className="input-field !pl-10 !py-2 text-xs"
                  />
                </div>
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[140px]"
                >
                  <option value="">All Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                {/* Reset Filters */}
                {(search || categoryFilter || statusFilter) && (
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

            {/* Inventory Items Table */}
            <div className="aura-glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('item_name')}>
                        Item Name <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('sku')}>
                        SKU <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('category')}>
                        Category <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('quantity')}>
                        Quantity <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('unit_cost')}>
                        Unit Cost <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('selling_price')}>
                        Selling Price <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5">Min Stock</th>
                      <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('status')}>
                        Status <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs font-medium text-slate-300">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-10 text-center text-slate-500">No stock items found in inventory.</td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-5 font-bold text-white">{item.item_name}</td>
                          <td className="p-5 font-mono text-[11px] text-slate-400">{item.sku || '—'}</td>
                          <td className="p-5">{item.category}</td>
                          <td className="p-5 font-mono font-bold text-white">{item.quantity}</td>
                          <td className="p-5">₹{Number(item.unit_cost).toLocaleString()}</td>
                          <td className="p-5 font-bold text-white">₹{Number(item.selling_price).toLocaleString()}</td>
                          <td className="p-5 font-mono text-slate-500">{item.minimum_stock}</td>
                          <td className="p-5">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                              item.status === 'In Stock' ? 'bg-emerald-500/10 text-emerald-400' :
                              item.status === 'Low Stock' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-5 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAdjustModal(item)}
                              className="px-2 py-1 py-1.5 rounded-lg bg-white/[0.03] hover:bg-earth-clay/10 border border-white/[0.05] text-slate-300 hover:text-earth-clay text-[10px] font-black uppercase tracking-wider transition"
                              title="Adjust Stock"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition"
                              title="Edit"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
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

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aura-glass p-6 space-y-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Stock Ledger Logs</h4>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto premium-scrollbar pr-2">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500">No stock ledger transactions found.</p>
              ) : (
                history.map((log) => (
                  <div key={log.id} className="text-xs flex items-center justify-between border-b border-white/[0.03] pb-3">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black mr-2 ${
                        log.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.type === 'OUT' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>{log.type}</span>
                      <span className="text-slate-300 font-bold">{log.item_name}</span>
                      <span className="text-slate-500 ml-2">Quantity: {log.quantity}</span>
                      {log.notes && <p className="text-[10px] text-slate-500 mt-1 italic">Notes: {log.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-600 block">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-500 font-medium">By {log.creator_email || 'System'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Inventory Item Modal */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsItemModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[480px] aura-glass-heavy p-8 z-10 overflow-hidden max-h-[90vh] overflow-y-auto premium-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase text-white tracking-widest">
                  {selectedItem ? 'Modify Item' : 'New Stock Item'}
                </h3>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleItemSubmit} className="space-y-5">
                {/* Item Name */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Item Name</label>
                  <input
                    type="text"
                    name="item_name"
                    required
                    value={itemForm.item_name}
                    onChange={handleItemInputChange}
                    placeholder="Enter product name (e.g. Whey Protein Isolate)"
                    className="input-field text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* SKU */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">SKU / Code</label>
                    <input
                      type="text"
                      name="sku"
                      value={itemForm.sku}
                      onChange={handleItemInputChange}
                      placeholder="e.g. WPI-1001"
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Category</label>
                    <select
                      name="category"
                      value={itemForm.category}
                      onChange={handleItemInputChange}
                      className="select-field text-xs !py-3"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Unit Cost */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[8px] sm:!text-[10px]">Unit Cost (INR)</label>
                    <input
                      type="number"
                      name="unit_cost"
                      required
                      min="0"
                      step="0.01"
                      value={itemForm.unit_cost}
                      onChange={handleItemInputChange}
                      placeholder="0.00"
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Selling Price */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[8px] sm:!text-[10px]">Retail Price (INR)</label>
                    <input
                      type="number"
                      name="selling_price"
                      required
                      min="0"
                      step="0.01"
                      value={itemForm.selling_price}
                      onChange={handleItemInputChange}
                      placeholder="0.00"
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Min Stock */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[8px] sm:!text-[10px]">Min Stock Alert</label>
                    <input
                      type="number"
                      name="minimum_stock"
                      required
                      min="0"
                      value={itemForm.minimum_stock}
                      onChange={handleItemInputChange}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                {/* Quantity - visible and editable ONLY on create to seed initial stock. Otherwise, use stock adjustment transaction. */}
                {!selectedItem && (
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Initial Quantity In Stock</label>
                    <input
                      type="number"
                      name="quantity"
                      min="0"
                      value={itemForm.quantity}
                      onChange={handleItemInputChange}
                      className="input-field text-xs"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs shadow-lg shadow-earth-clay/25 transition"
                  >
                    {selectedItem ? 'Update Item' : 'Create Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {isAdjustModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdjustModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[420px] aura-glass-heavy p-8 z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase text-white tracking-widest">Adjust Stock</h3>
                  <p className="text-[10px] text-earth-clay font-bold uppercase mt-1 tracking-wider">{adjustItem?.item_name}</p>
                </div>
                <button
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-5">
                {/* Current Stock Indicator */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold uppercase">Current Stock:</span>
                  <span className="font-mono font-bold text-white">{adjustItem?.quantity} {adjustItem?.unit}</span>
                </div>

                {/* Adjustment Type */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Adjustment Type</label>
                  <select
                    name="type"
                    value={adjustForm.type}
                    onChange={handleAdjustInputChange}
                    className="select-field text-xs !py-3"
                  >
                    <option value="IN">Stock In (Increment)</option>
                    <option value="OUT">Stock Out (Decrement)</option>
                    <option value="ADJUSTMENT">Explicit Adjustment (Set Exact Value)</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="0.01"
                    step="any"
                    value={adjustForm.quantity}
                    onChange={handleAdjustInputChange}
                    placeholder="Enter quantity amount..."
                    className="input-field text-xs"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Reason / Notes</label>
                  <textarea
                    name="notes"
                    rows="3"
                    value={adjustForm.notes}
                    onChange={handleAdjustInputChange}
                    placeholder="Provide a brief reason (e.g. Sales, stock audit adjustment)..."
                    className="input-field text-xs resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsAdjustModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs shadow-lg shadow-earth-clay/25 transition"
                  >
                    Apply Adjustment
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

export default Inventory;
