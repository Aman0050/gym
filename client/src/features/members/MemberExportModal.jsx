import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, FileText, FileSpreadsheet, 
  Filter, Calendar, Check, RefreshCcw, Database
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MemberExportModal = ({ isOpen, onClose, totalMembers }) => {
  const [format, setFormat] = useState('csv');
  const [scope, setScope] = useState('all'); // all, filtered
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        format,
        ...filters
      });

      // For direct browser download of CSV
      const response = await api.get(`/members/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FitVibe_Members_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Member data exported successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to generate export');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/[0.08] z-[210] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-10 py-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-earth-clay/10 rounded-2xl flex items-center justify-center border border-earth-clay/20 shadow-lg shadow-earth-clay/10">
                  <Download size={22} className="text-earth-clay" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-black text-ivory tracking-tight uppercase">Data Export Center</h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Enterprise Data Portability</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-500 hover:text-ivory transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto premium-scrollbar p-10 space-y-8">
              {/* Format Selection */}
              <section>
                <label className="label-text mb-4 block">Select Export Format</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'csv', label: 'CSV Spreadsheet', icon: FileText, desc: 'Best for bulk data import' },
                    { id: 'xlsx', label: 'Excel Workbook', icon: FileSpreadsheet, desc: 'Formatted for reporting', disabled: true },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => !item.disabled && setFormat(item.id)}
                      className={`
                        p-5 rounded-2xl border text-left transition-all relative overflow-hidden group
                        ${format === item.id 
                          ? 'bg-earth-clay/10 border-earth-clay/40 ring-1 ring-earth-clay/20' 
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                        }
                        ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <item.icon size={18} className={format === item.id ? 'text-earth-clay' : 'text-slate-500'} />
                        <span className={`text-[11px] font-black uppercase tracking-wider ${format === item.id ? 'text-ivory' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-bold leading-relaxed">{item.desc}</p>
                      {format === item.id && (
                        <div className="absolute top-3 right-3">
                          <Check size={14} className="text-earth-clay" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* Advanced Filters */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Filter size={14} className="text-earth-clay" />
                  <label className="label-text !text-ivory">Export Configuration</label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Member Status</span>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">All Statuses</option>
                      <option value="ACTIVE">Active Only</option>
                      <option value="FROZEN">Frozen Only</option>
                      <option value="CANCELLED">Cancelled Only</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Join Date Range</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="input-field flex-1"
                      />
                      <span className="text-slate-700">-</span>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Preview Statistics */}
              <div className="p-6 bg-earth-clay/5 border border-earth-clay/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-earth-clay/10 rounded-xl flex items-center justify-center">
                    <Database size={16} className="text-earth-clay" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ivory uppercase tracking-widest">Dataset Statistics</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Approx. {totalMembers} records selected</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-earth-clay leading-none">READY</p>
                  <p className="text-[8px] text-slate-700 font-black mt-1 uppercase tracking-widest">Audit Logs Active</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-8 border-t border-white/[0.05] bg-white/[0.01] flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-ivory transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="flex items-center gap-3 px-8 py-4 bg-earth-clay rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-earth-clay/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Download size={14} />}
                Generate {format.toUpperCase()} Report
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemberExportModal;
