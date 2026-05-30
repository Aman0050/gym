import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, FileText, FileSpreadsheet,
  Filter, Calendar, Check, Database,
  ShieldCheck, BarChart2, Activity, Loader2,
  CheckCircle2, AlertTriangle, Sparkles, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Button, StatusBadge } from '../../components/ui';
import { useAuthStore } from '../../store/useAuthStore';

// ── Export Phases ─────────────────────────────────────────────────────────────
// idle → preparing → generating → ready | error
const PHASES = {
  idle:       { label: 'Generate Report',              icon: Download,      color: 'text-earth-clay' },
  preparing:  { label: 'Preparing Data...',            icon: Loader2,       color: 'text-blue-400'   },
  generating: { label: 'Building Report...',           icon: Sparkles,      color: 'text-amber-400'  },
  ready:      { label: 'Download Complete',            icon: CheckCircle2,  color: 'text-emerald-400'},
  error:      { label: 'Generation Failed',            icon: AlertTriangle, color: 'text-red-400'    },
};

const MemberExportModal = ({ isOpen, onClose, totalMembers, previewData = [] }) => {
  const [format,       setFormat]       = useState('xlsx');
  const [phase,        setPhase]        = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuthStore();
  const [reportMeta,   setReportMeta]   = useState(null); // success metadata
  const [plans,        setPlans]        = useState([]);
  const [filters, setFilters] = useState({
    status:    '',
    startDate: '',
    endDate:   '',
    planId:    '',
  });

  const isLoading = phase === 'preparing' || phase === 'generating';

  // ── Load real plans for dropdown ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    api.get('/plans')
      .then(r => setPlans(r.data || []))
      .catch(() => setPlans([]));
  }, [isOpen]);

  // ── Reset state on close ─────────────────────────────────────────────────
  const handleClose = () => {
    if (isLoading) return;
    setPhase('idle');
    setErrorMessage('');
    setReportMeta(null);
    onClose();
  };

  const handleReset = () => {
    setPhase('idle');
    setErrorMessage('');
    setReportMeta(null);
  };

  // ── Intelligence Panel Metrics ───────────────────────────────────────────
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const estimatedSizeKB    = totalMembers > 0 ? Math.ceil(totalMembers * (format === 'xlsx' ? 0.9 : 0.45)) : 0;
  const lastExport         = localStorage.getItem('lastExportTime') || 'Never';

  // ── Preview ──────────────────────────────────────────────────────────────
  const previewRows     = previewData.slice(0, 3);
  const remainingRecords = totalMembers > 3 ? totalMembers - 3 : 0;

  // ── Export Handler ───────────────────────────────────────────────────────
  const handleExport = async () => {
    setPhase('preparing');
    setErrorMessage('');
    setReportMeta(null);

    try {
      // Build query params — strip empty values
      const raw = {
        format,
        ...(filters.status    ? { status:    filters.status    } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate   ? { endDate:   filters.endDate   } : {}),
        ...(filters.planId    ? { planId:    filters.planId    } : {}),
      };
      const queryParams = new URLSearchParams(raw);

      setPhase('generating');

      const response = await api.get(`/members/export?${queryParams.toString()}`, {
        responseType: 'blob',
      });

      // Build filename from Content-Disposition or fallback
      const disposition = response.headers?.['content-disposition'] || '';
      const nameMatch   = disposition.match(/filename="?([^"]+)"?/);
      const safeName = (user?.gym_name || 'FitXeno').replace(/\s+/g, '_');
      const filename    = nameMatch?.[1] || `${safeName}_Members_Report_${new Date().toISOString().split('T')[0]}.${format}`;

      // Trigger download
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Success state
      const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      localStorage.setItem('lastExportTime', now);
      setReportMeta({ filename, generatedAt: now, records: totalMembers });
      setPhase('ready');

    } catch (err) {
      let message = 'Report generation failed. Please retry or contact your system administrator.';
      // Try to parse structured error from blob
      try {
        const text = await err.response?.data?.text?.();
        const parsed = JSON.parse(text || '{}');
        if (parsed.message) message = parsed.message;
      } catch { /* ignore */ }

      setErrorMessage(message);
      setPhase('error');
    }
  };

  const PhaseIcon = PHASES[phase]?.icon || Download;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 m-auto w-full max-w-5xl h-fit max-h-[95vh] sm:max-h-[90vh] bg-[#0a0a0a]/98 backdrop-blur-3xl border border-white/[0.08] z-[210] rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-earth-clay/0 via-earth-clay/60 to-earth-clay/0" />

            {/* ── Header ── */}
            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.01] gap-4">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-earth-clay/10 rounded-2xl flex items-center justify-center border border-earth-clay/20 shadow-[0_0_30px_rgba(160,82,45,0.15)] relative group flex-shrink-0">
                  <div className="absolute inset-0 bg-earth-clay/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Database size={24} className="text-earth-clay relative z-10" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-ivory tracking-tight uppercase">
                    Data Export Center
                  </h2>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">
                    Enterprise Reporting &amp; Data Portability
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 absolute top-6 right-6 sm:relative sm:top-0 sm:right-0">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Audit Logs Enabled</span>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-10 h-10 flex items-center justify-center bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-500 hover:text-ivory hover:bg-white/[0.08] transition-all disabled:opacity-30"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto premium-scrollbar p-6 sm:p-10 flex flex-col lg:flex-row gap-10">

              {/* Left: Configuration */}
              <div className="flex-1 space-y-8 sm:space-y-10">

                {/* ── Success State ── */}
                <AnimatePresence>
                  {phase === 'ready' && reportMeta && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0,   scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="p-6 bg-emerald-500/8 border border-emerald-500/25 rounded-3xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
                        <CheckCircle2 size={120} className="text-emerald-400" />
                      </div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                          <CheckCircle2 size={20} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-emerald-300 mb-1">Enterprise report generated successfully.</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate mb-3" title={reportMeta.filename}>
                            📄 {reportMeta.filename}
                          </p>
                          <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>{reportMeta.records} records</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span>{reportMeta.generatedAt}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-ivory uppercase tracking-widest transition-colors"
                      >
                        <RefreshCw size={12} />
                        Generate Another Report
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Error State ── */}
                <AnimatePresence>
                  {phase === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-6 bg-red-500/8 border border-red-500/25 rounded-3xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
                        <AlertTriangle size={100} className="text-red-400" />
                      </div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center border border-red-500/30 flex-shrink-0">
                          <AlertTriangle size={20} className="text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-red-300 mb-1">Report Generation Failed</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{errorMessage}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-ivory uppercase tracking-widest transition-colors"
                      >
                        <RefreshCw size={12} />
                        Retry
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Format Selection ── */}
                {(phase === 'idle' || phase === 'ready') && (
                  <section>
                    <div className="flex items-center gap-2 mb-4 sm:mb-5">
                      <FileText size={16} className="text-earth-clay" />
                      <h3 className="text-sm font-black text-ivory tracking-tight">Format Selection</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          id: 'xlsx',
                          label: 'Excel Workbook',
                          icon: FileSpreadsheet,
                          desc: 'Premium styled report — color-coded, auto-fitted, with metadata header. Best for financial reporting & board presentations.',
                          badge: 'Recommended',
                        },
                        {
                          id: 'csv',
                          label: 'CSV Spreadsheet',
                          icon: FileText,
                          desc: 'Clean UTF-8 CSV with metadata block. Best for system imports, bulk operations & integrations.',
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setFormat(item.id)}
                          className={`
                            p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
                            ${format === item.id
                              ? 'bg-earth-clay/10 border-earth-clay/40 shadow-[0_10px_30px_-10px_rgba(160,82,45,0.3)]'
                              : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:-translate-y-1'
                            }
                          `}
                        >
                          {item.badge && (
                            <span className={`absolute top-3 ${format === item.id ? 'right-11' : 'right-3'} transition-all duration-300 text-[8px] font-black uppercase tracking-widest bg-earth-clay/20 text-earth-clay px-2 py-0.5 rounded-full border border-earth-clay/30`}>
                              {item.badge}
                            </span>
                          )}
                          <div className="flex items-center gap-4 mb-3">
                            <div className={`p-2 rounded-xl ${format === item.id ? 'bg-earth-clay/20' : 'bg-white/5'}`}>
                              <item.icon size={20} className={format === item.id ? 'text-earth-clay' : 'text-slate-500'} />
                            </div>
                            <span className={`text-xs font-black uppercase tracking-wider ${format === item.id ? 'text-ivory' : 'text-slate-400'}`}>
                              {item.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed pr-12">{item.desc}</p>
                          <AnimatePresence>
                            {format === item.id && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute top-3 right-3 w-5 h-5 bg-earth-clay rounded-full flex items-center justify-center shadow-lg shadow-earth-clay/40"
                              >
                                <Check size={12} className="text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* ── Filters ── */}
                {(phase === 'idle' || phase === 'ready') && (
                  <section>
                    <div className="flex items-center gap-2 mb-4 sm:mb-5">
                      <Filter size={16} className="text-earth-clay" />
                      <h3 className="text-sm font-black text-ivory tracking-tight">Data Filters</h3>
                      {activeFiltersCount > 0 && (
                        <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-earth-clay bg-earth-clay/10 border border-earth-clay/20 px-2 py-0.5 rounded-full">
                          {activeFiltersCount} Active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 sm:p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">

                      {/* Status */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Activity size={12} /> Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-ivory focus:border-earth-clay/50 focus:ring-1 focus:ring-earth-clay/50 transition-all outline-none"
                        >
                          <option className="bg-[#111] text-slate-300" value="">All Statuses</option>
                          <option className="bg-[#111] text-slate-300" value="ACTIVE">Active Only</option>
                          <option className="bg-[#111] text-slate-300" value="FROZEN">Frozen Only</option>
                          <option className="bg-[#111] text-slate-300" value="SUSPENDED">Suspended Only</option>
                        </select>
                      </div>

                      {/* Plan Type — real plans from API */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <BarChart2 size={12} /> Plan Type
                        </label>
                        <select
                          value={filters.planId}
                          onChange={(e) => setFilters({ ...filters, planId: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-ivory focus:border-earth-clay/50 focus:ring-1 focus:ring-earth-clay/50 transition-all outline-none"
                        >
                          <option className="bg-[#111] text-slate-300" value="">All Plans</option>
                          {(plans || []).map(p => (
                            <option className="bg-[#111] text-slate-300" key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Join Date Range */}
                      <div className="space-y-2.5 sm:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} /> Membership Start Date Range
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:border-earth-clay/50 outline-none"
                          />
                          <span className="hidden sm:inline text-slate-600 font-black tracking-widest text-xs">TO</span>
                          <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 focus:border-earth-clay/50 outline-none"
                          />
                        </div>
                      </div>

                    </div>
                  </section>
                )}
              </div>

              {/* Right: Intelligence + Preview */}
              <div className="w-full lg:w-[380px] flex flex-col gap-6">

                {/* Export Intelligence Panel */}
                <div className="p-6 bg-earth-clay/5 border border-earth-clay/20 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.06] pointer-events-none">
                    <Database size={110} className="text-earth-clay" />
                  </div>
                  <h3 className="text-[10px] font-black text-earth-clay uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-earth-clay animate-pulse" />
                    Export Intelligence
                  </h3>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Est. Records</p>
                      <p className="text-xl font-black text-ivory">{totalMembers}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active Filters</p>
                      <p className="text-xl font-black text-ivory">{activeFiltersCount}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Est. File Size</p>
                      <p className="text-lg font-black text-ivory">{estimatedSizeKB} <span className="text-xs text-slate-500">KB</span></p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Last Export</p>
                      <p className="text-xs font-black text-ivory truncate" title={lastExport}>{lastExport}</p>
                    </div>
                  </div>

                  {/* Format badge */}
                  <div className="mt-5 pt-5 border-t border-earth-clay/10 flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-full border border-white/5">
                      {format === 'xlsx'
                        ? <FileSpreadsheet size={12} className="text-emerald-400" />
                        : <FileText size={12} className="text-blue-400" />}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {format === 'xlsx' ? 'Excel — Styled Report' : 'CSV — Plain Data'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden shadow-inner shadow-black/20">
                  <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Preview</h3>
                    <span className="text-[9px] font-bold text-earth-clay bg-earth-clay/10 px-2 py-0.5 rounded uppercase">First 3 Rows</span>
                  </div>
                  <div className="flex-1 overflow-y-auto premium-scrollbar p-1">
                    {previewRows.length > 0 ? (
                      <div className="divide-y divide-white/[0.05]">
                        {(previewRows || []).map((row, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="min-w-0 flex-1 pr-4">
                              <p className="text-xs font-black text-ivory truncate uppercase">{row.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium truncate">{row.phone}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <StatusBadge status={row.status} />
                              <p className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase">
                                {row.join_date ? new Date(row.join_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-500">
                        <Database size={24} className="mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No preview data</p>
                      </div>
                    )}
                  </div>
                  {remainingRecords > 0 && (
                    <div className="p-3 text-center bg-black/40 border-t border-white/[0.05]">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        + {remainingRecords} more records in export
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 sm:px-10 py-5 sm:py-6 border-t border-white/[0.05] bg-black/40 flex items-center justify-between gap-4">
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                All exports are tracked, timestamped, and audited for security compliance.
              </p>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {phase === 'ready' ? 'Close' : 'Cancel'}
                </Button>

                {phase !== 'ready' && (
                  <button
                    onClick={handleExport}
                    disabled={isLoading || phase === 'error'}
                    className={`
                      relative flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 overflow-hidden
                      ${isLoading
                        ? 'bg-earth-clay/30 border border-earth-clay/20 text-earth-clay/60 cursor-not-allowed'
                        : phase === 'error'
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400 cursor-not-allowed'
                          : 'bg-earth-clay border border-earth-clay/50 text-white shadow-xl shadow-earth-clay/25 hover:shadow-earth-clay/40 hover:-translate-y-0.5 active:translate-y-0'
                      }
                    `}
                  >
                    {/* Animated shimmer on loading */}
                    {isLoading && (
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                      />
                    )}
                    <PhaseIcon
                      size={16}
                      className={isLoading ? 'animate-spin' : ''}
                    />
                    <span className="relative z-10">
                      {isLoading
                        ? PHASES[phase].label
                        : phase === 'error'
                          ? 'Generation Failed'
                          : `Generate ${format.toUpperCase()} Report`}
                    </span>
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemberExportModal;
