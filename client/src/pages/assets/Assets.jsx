import React, { useState, useEffect } from 'react';
import { assetService } from '../../services/assetService';
import { generateReportPDF } from '../../utils/reportPDFGenerator';
import { operationsReportService } from '../../services/operationsReportService';
import {
  Plus, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  Trash2, Edit, FileText, CheckCircle, Clock, X,
  Download, Eye, Activity, ShieldAlert, BadgeDollarSign, RotateCcw, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ASSET_TYPES = ['Treadmills', 'Cycles', 'Machines', 'Dumbbells', 'Equipment'];

const Assets = () => {
  const [assets, setAssets] = useState([]);

  // Filters State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('asset_name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: 'Treadmills',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: '',
    warranty_expiry: '',
    last_service_date: '',
    next_service_date: '',
    status: 'Active',
    notes: ''
  });

  useEffect(() => {
    fetchAssets();
  }, [page, search, typeFilter, statusFilter, sortBy, sortOrder]);

  const fetchAssets = async () => {
    try {
      const data = await assetService.getAssets({
        page,
        limit,
        search,
        type: typeFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      setAssets(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load equipment assets');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setSelectedAsset(null);
    setFormData({
      asset_name: '',
      asset_type: 'Treadmills',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: '',
      warranty_expiry: '',
      last_service_date: '',
      next_service_date: '',
      status: 'Active',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      purchase_date: new Date(asset.purchase_date).toISOString().split('T')[0],
      purchase_cost: asset.purchase_cost,
      warranty_expiry: asset.warranty_expiry ? new Date(asset.warranty_expiry).toISOString().split('T')[0] : '',
      last_service_date: asset.last_service_date ? new Date(asset.last_service_date).toISOString().split('T')[0] : '',
      next_service_date: asset.next_service_date ? new Date(asset.next_service_date).toISOString().split('T')[0] : '',
      status: asset.status,
      notes: asset.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData };
    
    // Clean empty date values
    ['warranty_expiry', 'last_service_date', 'next_service_date'].forEach(key => {
      if (!data[key]) data[key] = null;
    });

    try {
      if (selectedAsset) {
        await assetService.updateAsset(selectedAsset.id, data);
        toast.success('Equipment asset updated');
      } else {
        await assetService.createAsset(data);
        toast.success('Asset added successfully');
      }
      setIsModalOpen(false);
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save asset details');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm('Delete this equipment asset? This deletes all maintenance records for this asset.')) {
      try {
        await assetService.deleteAsset(id);
        toast.success('Equipment asset deleted');
        fetchAssets();
      } catch (err) {
        toast.error('Failed to delete asset');
      }
    }
  };

  const triggerExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'exporting' });
      await operationsReportService.exportData('assets', format);
      toast.success('Export downloaded successfully', { id: 'exporting' });
    } catch (err) {
      toast.error('Failed to export assets report', { id: 'exporting' });
    }
  };

  const handleGeneratePDFReport = () => {
    const headers = ['Asset Name', 'Type', 'Purchase Date', 'Cost', 'Warranty Expiry', 'Last Service', 'Next Service', 'Status'];
    const tableData = assets.map(a => [
      a.asset_name,
      a.asset_type,
      new Date(a.purchase_date).toLocaleDateString('en-IN'),
      `INR ${Number(a.purchase_cost).toLocaleString('en-IN')}`,
      a.warranty_expiry ? new Date(a.warranty_expiry).toLocaleDateString('en-IN') : '—',
      a.last_service_date ? new Date(a.last_service_date).toLocaleDateString('en-IN') : '—',
      a.next_service_date ? new Date(a.next_service_date).toLocaleDateString('en-IN') : '—',
      a.status
    ]);
    generateReportPDF('Equipment Assets List', headers, tableData);
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
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
          <h1 className="page-title text-white">Equipment & Assets</h1>
          <p className="body-text">Track treadmills, spin bikes, lifting machinery, dumbbells, and overall asset servicing schedules.</p>
        </div>
        <div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs shadow-lg shadow-earth-clay/20 transition flex items-center gap-2"
          >
            <Plus size={14} />
            Register Asset
          </button>
        </div>
      </div>

      {/* Filter and Export Hub */}
      <div className="aura-glass p-5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1 min-w-0">
          {/* Search */}
          <div className="relative w-full max-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="input-field !pl-10 !py-2 text-xs"
            />
          </div>
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[150px]"
          >
            <option value="">All Types</option>
            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
          {/* Reset Filters */}
          {(search || typeFilter || statusFilter) && (
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

      {/* Assets Table */}
      <div className="aura-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('asset_name')}>
                  Asset Name <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('asset_type')}>
                  Type <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('purchase_date')}>
                  Purchase Date <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('purchase_cost')}>
                  Cost <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5">Warranty Expiry</th>
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('last_service_date')}>
                  Last Serviced <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('next_service_date')}>
                  Next Maintenance <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('status')}>
                  Status <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs font-medium text-slate-300">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-10 text-center text-slate-500">No equipment assets registered.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-5 font-bold text-white">{asset.asset_name}</td>
                    <td className="p-5">{asset.asset_type}</td>
                    <td className="p-5">{new Date(asset.purchase_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-5 font-bold text-white">₹{Number(asset.purchase_cost).toLocaleString()}</td>
                    <td className="p-5 text-slate-400">
                      {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="p-5 text-slate-400">
                      {asset.last_service_date ? new Date(asset.last_service_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="p-5 text-earth-clay font-bold">
                      {asset.next_service_date ? new Date(asset.next_service_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                        asset.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                        asset.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="p-5 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(asset)}
                        className="p-2 rounded-lg bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition"
                        title="Edit"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
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

      {/* Add/Edit Asset Modal */}
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
                  {selectedAsset ? 'Modify Asset' : 'Register Gym Asset'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                {/* Asset Name */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Asset Name</label>
                  <input
                    type="text"
                    name="asset_name"
                    required
                    value={formData.asset_name}
                    onChange={handleInputChange}
                    placeholder="Enter equipment name (e.g. Commercial Treadmill T80)"
                    className="input-field text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Asset Type */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Asset Type</label>
                    <select
                      name="asset_type"
                      value={formData.asset_type}
                      onChange={handleInputChange}
                      className="select-field text-xs !py-3"
                    >
                      {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {/* Purchase Cost */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Purchase Cost (INR)</label>
                    <input
                      type="number"
                      name="purchase_cost"
                      required
                      min="0"
                      step="0.01"
                      value={formData.purchase_cost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Purchase Date */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Purchase Date</label>
                    <input
                      type="date"
                      name="purchase_date"
                      required
                      value={formData.purchase_date}
                      onChange={handleInputChange}
                      className="input-field text-xs !py-[9px]"
                    />
                  </div>
                  {/* Warranty Expiry */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Warranty Expiry</label>
                    <input
                      type="date"
                      name="warranty_expiry"
                      value={formData.warranty_expiry}
                      onChange={handleInputChange}
                      className="input-field text-xs !py-[9px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Last Service Date */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Last Serviced Date</label>
                    <input
                      type="date"
                      name="last_service_date"
                      value={formData.last_service_date}
                      onChange={handleInputChange}
                      className="input-field text-xs !py-[9px]"
                    />
                  </div>
                  {/* Next Service Date */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Next Maintenance Date</label>
                    <input
                      type="date"
                      name="next_service_date"
                      value={formData.next_service_date}
                      onChange={handleInputChange}
                      className="input-field text-xs !py-[9px]"
                    />
                  </div>
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
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Asset Notes / Specifications</label>
                  <textarea
                    name="notes"
                    rows="3"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter serial numbers, supplier contact, or notes..."
                    className="input-field text-xs resize-none"
                  />
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
                    {selectedAsset ? 'Update Asset' : 'Add Asset'}
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

export default Assets;
