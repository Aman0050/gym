import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Building2, Globe, IndianRupee, Users,
  BarChart3, ShieldAlert, CheckCircle, Search,
  Activity, TrendingUp, Zap, ShieldCheck,
  AlertCircle, UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, StatusBadge, Table, TableRow, Modal, Input } from '../components/ui';
import { FadeIn, PageTransition, AnimatedCounter } from '../components/Animations';
import { searchMatch } from '../utils/searchMatch';
import { DashboardSkeleton } from '../components/Skeleton';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [assigningManagerId, setAssigningManagerId] = useState(null);
  const [managerName, setManagerName] = useState('');
  const [savingManager, setSavingManager] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [triggeringBackup, setTriggeringBackup] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, gymsRes, backupRes] = await Promise.all([
        api.get('/gyms/analytics/global'),
        api.get('/gyms'),
        api.get('/admin/backups/status').catch(() => ({ data: { recentLogs: [], lastSuccessful: {} } }))
      ]);
      setStats(statsRes.data);
      setGyms(gymsRes.data);
      setBackupStatus(backupRes.data);
    } catch (err) {
      toast.error('Failed to load platform data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUpdatingId(id);
    try {
      await api.patch(`/gyms/${id}/status`, { status: newStatus });
      toast.success(`Branch ${newStatus === 'ACTIVE' ? 'reactivated' : 'suspended'} successfully`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update branch status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignManager = async (e) => {
    e.preventDefault();
    if (!assigningManagerId) return;
    setSavingManager(true);
    try {
      await api.patch(`/gyms/${assigningManagerId}/manager`, { contact_person: managerName });
      toast.success('Manager assigned successfully');
      setAssigningManagerId(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to assign manager');
    } finally {
      setSavingManager(false);
    }
  };

  const handleTriggerBackup = async () => {
    setTriggeringBackup(true);
    try {
      await api.post('/admin/backups/trigger');
      toast.success('Manual backup triggered. It will complete in the background.');
      setTimeout(fetchData, 3000); // refresh status after a short delay
    } catch (err) {
      toast.error('Failed to trigger backup');
    } finally {
      setTriggeringBackup(false);
    }
  };

  const downloadExport = async (endpoint, filename) => {
    try {
      const toastId = toast.loading(`Preparing ${filename}...`);
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Export downloaded successfully', { id: toastId });
    } catch (err) {
      toast.error('Failed to download export');
    }
  };

  if (loading) return <DashboardSkeleton />;

  const filteredGyms = (gyms || []).filter((g) =>
    searchMatch(search, g?.name, g?.location)
  );

  const kpiStats = [
    { label: 'Total Branches',  value: stats.totalGyms,    icon: Building2 },
    { label: 'Active Branches', value: stats.activeGyms,   icon: Zap },
    { label: 'Total Revenue',   value: stats.totalRevenue, icon: IndianRupee, isCurrency: true },
    { label: 'Total Members',   value: stats.totalMembers, icon: Users },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto pb-safe-area">

        {/* ── Page Header ── */}
        <FadeIn direction="down" duration={0.4}>
          <div className="page-header shadow-xl">
            <div className="page-header-meta">
              <div className="flex items-center gap-3">
                <span className="status-dot-live" />
                <span className="label-text">Network Administration</span>
              </div>
              <h1 className="page-title text-ivory">
                Platform{' '}
                <span className="text-earth-clay italic">Overview</span>
              </h1>
              <p className="body-text text-sm opacity-70">
                Multi-tenant network oversight and branch administration.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.04] px-6 py-3.5 rounded-2xl border border-white/[0.07] self-start lg:self-center">
              <Globe className="text-earth-clay w-5 h-5 flex-shrink-0" />
              <div>
                <p className="label-text !text-[8px] !text-slate-500">Network Reach</p>
                <p className="text-sm font-black text-ivory tracking-wide">
                  {stats.totalGyms} Active Branch{stats.totalGyms !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Global KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiStats.map((s, i) => (
            <FadeIn key={s.label} direction="up" delay={i * 0.06} duration={0.4}>
              <Card variant="default" className="p-6 lg:p-8 h-40 lg:h-44 flex flex-col justify-between overflow-hidden relative group">
                <div className="absolute inset-0 bg-earth-clay/0 group-hover:bg-earth-clay/[0.02] transition-colors duration-700 rounded-[inherit]" />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/[0.07] text-earth-clay relative z-10">
                  <s.icon size={18} />
                </div>
                <div className="relative z-10">
                  <p className="label-text !text-[8px] !text-slate-500 mb-2">{s.label}</p>
                  <h3 className="text-3xl lg:text-4xl font-black text-ivory leading-none tracking-tight flex items-baseline gap-1">
                    {s.isCurrency && <span className="text-emerald-400">₹</span>}
                    <AnimatedCounter value={s.value} />
                  </h3>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* ── Backup Monitoring & Exports ── */}
        <FadeIn direction="up" delay={0.15} duration={0.4}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white/[0.02] border border-white/[0.05]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-ivory flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    Data Protection Engine
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Logical database backups via Supabase & pg_dump
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleTriggerBackup} loading={triggeringBackup}>
                  Run Manual Backup
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Daily Backup</p>
                    <p className="text-sm text-ivory mt-1">
                      {backupStatus?.lastSuccessful?.DAILY ? new Date(backupStatus.lastSuccessful.DAILY).toLocaleString() : 'No recent backup'}
                    </p>
                  </div>
                  {backupStatus?.lastSuccessful?.DAILY && new Date() - new Date(backupStatus.lastSuccessful.DAILY) < 86400000 * 2 ? (
                    <CheckCircle size={20} className="text-emerald-400" />
                  ) : (
                    <AlertCircle size={20} className="text-amber-400" />
                  )}
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Weekly Backup</p>
                    <p className="text-sm text-ivory mt-1">
                      {backupStatus?.lastSuccessful?.WEEKLY ? new Date(backupStatus.lastSuccessful.WEEKLY).toLocaleString() : 'No recent backup'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/[0.02] border border-white/[0.05]">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-ivory flex items-center gap-2">
                  <BarChart3 size={20} className="text-earth-clay" />
                  Enterprise Data Exports
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Export global platform data for external analysis
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => downloadExport('/members/export/csv?format=csv', 'Global_Members.csv')} className="w-full flex items-center justify-center gap-2 !py-4 border-dashed border-white/20">
                  Export Members
                </Button>
                <Button variant="secondary" onClick={() => downloadExport('/admin/exports/payments?format=csv', 'Global_Payments.csv')} className="w-full flex items-center justify-center gap-2 !py-4 border-dashed border-white/20">
                  Export Payments
                </Button>
                <Button variant="secondary" onClick={() => downloadExport('/admin/exports/attendance?format=csv', 'Global_Attendance.csv')} className="w-full flex items-center justify-center gap-2 !py-4 border-dashed border-white/20">
                  Export Attendance
                </Button>
                <Button variant="secondary" onClick={() => downloadExport('/admin/exports/subscriptions?format=csv', 'Global_Subscriptions.csv')} className="w-full flex items-center justify-center gap-2 !py-4 border-dashed border-white/20">
                  Export Subscriptions
                </Button>
              </div>
            </Card>
          </div>
        </FadeIn>

        {/* ── Branch Directory ── */}
        <FadeIn direction="up" delay={0.25} duration={0.4}>
          <div className="overflow-hidden shadow-xl rounded-[1.25rem] border border-white/[0.05] bg-white/[0.02]">
            {/* Table Toolbar */}
            <div className="p-6 lg:p-8 border-b border-white/[0.06] bg-white/[0.02] flex flex-col md:flex-row gap-6 lg:gap-8 items-center justify-between">
              <div className="flex items-center gap-4 self-start md:self-auto">
                <BarChart3 size={18} className="text-earth-clay" />
                <h3 className="label-text !text-ivory !text-sm sm:!text-base">Branch Directory</h3>
              </div>
              <div className="relative w-full md:w-64 lg:w-80 flex-shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl py-3.5 pl-11 pr-6 text-white text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-earth-clay/30 transition-all shadow-inner"
                />
              </div>
            </div>

            <Table
              headers={[
                { label: 'Branch',      className: 'flex-[2]' },
                { label: 'Manager',     className: 'flex-1 hidden md:table-cell' },
                { label: 'Performance', className: 'flex-1 hidden md:table-cell' },
                { label: 'Status',      className: 'w-36' },
                { label: 'Actions',     className: 'w-20 text-right' },
              ]}
              emptyMessage="No branches found."
              emptyIcon={Building2}
            >
              {filteredGyms.map((g) => (
                <TableRow 
                  key={g.id}
                  onClick={() => navigate(`/super-admin/branches/${g.id}`)}
                  className="cursor-pointer hover:bg-white/[0.02] transition-all duration-300"
                >
                  {/* ── Branch Identity ── */}
                  <div className="flex-[2] flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.07] flex-shrink-0 shadow-inner group-hover:border-earth-clay/20 transition-colors">
                      <Building2 size={18} className="text-earth-clay" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-ivory truncate">{g.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider truncate">
                        {g.location} • {g.phone}
                      </p>
                    </div>
                  </div>

                  {/* ── Manager info ── */}
                  <div className="flex-1 flex-col hidden md:flex">
                    <p className="text-xs font-black text-slate-400 truncate">{g.contact_person || 'Unassigned'}</p>
                  </div>

                  {/* ── Performance ── */}
                  <div className="flex-1 items-center gap-6 hidden md:flex">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-slate-500" />
                      <p className="text-sm font-black text-ivory">{g.total_members || 0}</p>
                    </div>
                    <div className="w-px h-6 bg-white/[0.08]" />
                    <div className="flex items-center gap-1">
                      <IndianRupee size={12} className="text-emerald-500" />
                      <p className="text-sm font-black text-emerald-500">
                        {Number(g.total_revenue || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* ── Desktop Status ── */}
                  <div className="w-36 flex items-center">
                    <StatusBadge status={g.saas_subscription_status} />
                  </div>

                  {/* ── Actions ── */}
                  <div className="w-20 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssigningManagerId(g.id);
                        setManagerName(g.contact_person || '');
                      }}
                      className="w-9 h-9 rounded-xl transition-all border flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-500/[0.08] border-white/[0.05] hover:border-blue-500/20"
                      title="Assign Manager"
                    >
                      <UserPlus size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(g.id, g.saas_subscription_status);
                      }}
                      disabled={updatingId === g.id}
                      className={`w-9 h-9 rounded-xl transition-all border flex items-center justify-center ${
                        updatingId === g.id
                          ? 'opacity-50 cursor-not-allowed border-white/[0.07] text-slate-600'
                          : g.saas_subscription_status === 'ACTIVE'
                          ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] border-white/[0.05] hover:border-red-500/20'
                          : 'text-earth-clay hover:text-emerald-400 hover:bg-emerald-500/[0.08] border-white/[0.05] hover:border-emerald-500/20'
                      }`}
                      title={g.saas_subscription_status === 'ACTIVE' ? 'Suspend branch' : 'Reactivate branch'}
                    >
                      {updatingId === g.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : g.saas_subscription_status === 'ACTIVE' ? (
                        <ShieldAlert size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </button>
                  </div>
                </TableRow>
              ))}
            </Table>
          </div>
        </FadeIn>

        {/* ── Assign Manager Modal ── */}
        <Modal
          isOpen={!!assigningManagerId}
          onClose={() => setAssigningManagerId(null)}
          title="Assign Branch Manager"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAssignManager} className="space-y-6">
            <Input
              label="Manager Name"
              placeholder="Enter full name..."
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              required
            />
            <div className="flex gap-4">
              <Button variant="secondary" className="flex-1" type="button" onClick={() => setAssigningManagerId(null)}>Cancel</Button>
              <Button type="submit" variant="primary" className="flex-1 shadow-xl" loading={savingManager}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </PageTransition>
  );
};

export default SuperAdminDashboard;
