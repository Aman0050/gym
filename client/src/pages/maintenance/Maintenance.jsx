import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenanceService';
import { assetService } from '../../services/assetService';
import { generateReportPDF } from '../../utils/reportPDFGenerator';
import { operationsReportService } from '../../services/operationsReportService';
import {
  Plus, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  Trash2, FileText, CheckCircle, Clock, X,
  Download, Eye, Activity, RotateCcw, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Maintenance = () => {
  const [logs, setLogs] = useState([]);
  const [assets, setAssets] = useState([]);

  // Filters State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState('');
  const [sortBy, setSortBy] = useState('service_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: '',
    description: '',
    repair_cost: '',
    service_date: new Date().toISOString().split('T')[0],
    asset_status: 'Active' // Option to update asset status
  });
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState('');

  // Initial load
  useEffect(() => {
    fetchAssetsDropdown();
  }, []);

  // Reload logs on filters change
  useEffect(() => {
    fetchLogs();
  }, [page, search, assetFilter, sortBy, sortOrder]);

  const fetchAssetsDropdown = async () => {
    try {
      const data = await assetService.getAssets({ limit: 100 });
      setAssets(data.data);
    } catch (err) {
      toast.error('Failed to load assets list');
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await maintenanceService.getMaintenanceLogs({
        page,
        limit,
        search,
        asset_id: assetFilter,
        sortBy,
        sortOrder
      });
      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load maintenance history');
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
      setInvoicePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenAddModal = () => {
    if (assets.length === 0) {
      toast.error('Please register equipment assets first before logging maintenance');
      return;
    }
    setFormData({
      asset_id: assets[0].id,
      description: '',
      repair_cost: '',
      service_date: new Date().toISOString().split('T')[0],
      asset_status: 'Active'
    });
    setInvoiceFile(null);
    setInvoicePreview('');
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
      await maintenanceService.createMaintenanceLog(data);
      toast.success('Maintenance log recorded successfully');
      setIsModalOpen(false);
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record maintenance log');
    }
  };

  const triggerExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'exporting' });
      await operationsReportService.exportData('maintenance', format);
      toast.success('Export downloaded successfully', { id: 'exporting' });
    } catch (err) {
      toast.error('Failed to export maintenance report', { id: 'exporting' });
    }
  };

  const handleGeneratePDFReport = () => {
    const headers = ['Asset Name', 'Description', 'Repair Cost', 'Service Date', 'Logged By'];
    const tableData = logs.map(l => [
      l.asset_name,
      l.description,
      `INR ${Number(l.repair_cost).toLocaleString('en-IN')}`,
      new Date(l.service_date).toLocaleDateString('en-IN'),
      l.creator_email || 'System'
    ]);
    generateReportPDF('Equipment Servicing Report', headers, tableData);
  };

  const resetFilters = () => {
    setSearch('');
    setAssetFilter('');
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
          <h1 className="page-title text-white">Service & Maintenance</h1>
          <p className="body-text">Document equipment servicing records, mechanical repairs, service vendors, and maintenance invoices.</p>
        </div>
        <div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs shadow-lg shadow-earth-clay/20 transition flex items-center gap-2"
          >
            <Plus size={14} />
            Log Servicing
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
              placeholder="Search repair logs..."
              className="input-field !pl-10 !py-2 text-xs"
            />
          </div>
          {/* Asset Filter */}
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[170px]"
          >
            <option value="">All Equipment</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name}</option>)}
          </select>
          {/* Reset Filters */}
          {(search || assetFilter) && (
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

      {/* Maintenance Logs Table */}
      <div className="aura-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('asset_name')}>
                  Asset Name <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5">Servicing Description</th>
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('repair_cost')}>
                  Repair Cost <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5 cursor-pointer hover:text-earth-clay transition" onClick={() => toggleSort('service_date')}>
                  Service Date <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className="p-5">Logged By</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs font-medium text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500">No equipment servicing records logged.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-5 font-bold text-white">{log.asset_name}</td>
                    <td className="p-5 text-slate-400 truncate max-w-[280px]" title={log.description}>{log.description}</td>
                    <td className="p-5 font-bold text-white">₹{Number(log.repair_cost).toLocaleString()}</td>
                    <td className="p-5">{new Date(log.service_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-5 text-slate-400">
                      <span className="block font-semibold text-slate-300">{log.creator_email || 'System'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {log.id.substring(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="p-5 text-right">
                      {log.invoice_url ? (
                        <a
                          href={`${import.meta.env.VITE_API_URL}${log.invoice_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-earth-clay/10 border border-white/[0.05] text-slate-300 hover:text-earth-clay text-[10px] font-black uppercase tracking-wider transition"
                          title="Download Bill"
                        >
                          Invoice
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">No Invoice</span>
                      )}
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

      {/* Log Servicing Modal */}
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
              className="relative w-full max-w-[480px] aura-glass-heavy p-8 z-10 overflow-hidden max-h-[90vh] overflow-y-auto premium-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase text-white tracking-widest">
                  Log Servicing / Repair
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                {/* Select Asset */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Select Equipment Asset</label>
                  <select
                    name="asset_id"
                    value={formData.asset_id}
                    onChange={handleInputChange}
                    className="select-field text-xs !py-3"
                  >
                    {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Cost */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Servicing Cost (INR)</label>
                    <input
                      type="number"
                      name="repair_cost"
                      required
                      min="0"
                      step="0.01"
                      value={formData.repair_cost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Servicing Date</label>
                    <input
                      type="date"
                      name="service_date"
                      required
                      value={formData.service_date}
                      onChange={handleInputChange}
                      className="input-field text-xs !py-[9px]"
                    />
                  </div>
                </div>

                {/* Asset status post maintenance */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Equipment Status Post Servicing</label>
                  <select
                    name="asset_status"
                    value={formData.asset_status}
                    onChange={handleInputChange}
                    className="select-field text-xs !py-3"
                  >
                    <option value="Active">Active (Functional & back in gym)</option>
                    <option value="Maintenance">Maintenance (Still under repair)</option>
                    <option value="Retired">Retired (Scrapped/disposed)</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Description of service/repairs</label>
                  <textarea
                    name="description"
                    required
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe issue and parts replaced (e.g. Treadmill belt replacement by technician)..."
                    className="input-field text-xs resize-none"
                  />
                </div>

                {/* Invoice Upload */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Upload Repair Invoice / Receipt (PDF, PNG, JPG - Max 5MB)</label>
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
                    Log Service Record
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

export default Maintenance;
