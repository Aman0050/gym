import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Building2, Globe, IndianRupee, Users,
  BarChart3, ShieldAlert, CheckCircle, Search,
  Activity, TrendingUp, Zap, ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, StatusBadge, Table, TableRow } from '../components/ui';
import { FadeIn, PageTransition, AnimatedCounter } from '../components/Animations';
import { DashboardSkeleton } from '../components/Skeleton';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, gymsRes] = await Promise.all([
        api.get('/gyms/analytics/global'),
        api.get('/gyms'),
      ]);
      setStats(statsRes.data);
      setGyms(gymsRes.data);
    } catch (err) {
      toast.error('Failed to load platform data');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) return <DashboardSkeleton />;

  const filteredGyms = gyms.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.location?.toLowerCase().includes(search.toLowerCase())
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
                    {s.isCurrency && <span className="text-emerald-400 text-xl">₹</span>}
                    <AnimatedCounter value={s.value} />
                  </h3>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* ── Branch Directory ── */}
        <FadeIn direction="up" delay={0.25} duration={0.4}>
          <Card variant="flat" className="p-0 overflow-hidden shadow-xl">
            {/* Table Toolbar */}
            <div className="px-6 py-5 border-b border-white/[0.06] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 size={17} className="text-earth-clay" />
                <h3 className="label-text !text-ivory">Branch Directory</h3>
              </div>
              <div className="relative w-full md:max-w-xs">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-11 !py-3 text-sm w-full"
                />
              </div>
            </div>

            <Table
              headers={[
                { label: 'Branch',      className: 'flex-[2]' },
                { label: 'Manager',     className: 'flex-1' },
                { label: 'Performance', className: 'flex-1' },
                { label: 'Status',      className: 'w-36' },
                { label: 'Actions',     className: 'w-20 text-right' },
              ]}
              emptyMessage="No branches found."
              emptyIcon={<Building2 size={22} className="text-slate-600" />}
            >
              {filteredGyms.map((g) => (
                <TableRow key={g.id}>
                  {/* Branch */}
                  <div className="flex-[2] flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center border border-white/[0.07] flex-shrink-0">
                      <Building2 size={16} className="text-earth-clay" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-ivory truncate">{g.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wide truncate">
                        {g.location}
                      </p>
                    </div>
                  </div>

                  {/* Manager */}
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-400">{g.contact_person}</p>
                    <p className="text-[10px] text-slate-600 font-semibold mt-0.5">{g.phone}</p>
                  </div>

                  {/* Performance */}
                  <div className="flex-1">
                    <div className="flex items-center gap-5">
                      <div>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Members</p>
                        <p className="text-xs font-black text-ivory mt-0.5">{g.total_members || 0}</p>
                      </div>
                      <div className="w-px h-5 bg-white/[0.06]" />
                      <div>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Revenue</p>
                        <p className="text-xs font-black text-earth-clay mt-0.5">
                          ₹{Number(g.total_revenue || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-36 flex items-center mt-3 lg:mt-0">
                    <StatusBadge status={g.saas_subscription_status} />
                  </div>

                  {/* Actions */}
                  <div className="w-20 flex justify-end mt-3 lg:mt-0">
                    <button
                      onClick={() => handleStatusUpdate(g.id, g.saas_subscription_status)}
                      disabled={updatingId === g.id}
                      className={`w-9 h-9 rounded-xl transition-all border flex items-center justify-center ${
                        updatingId === g.id
                          ? 'opacity-50 cursor-not-allowed border-white/[0.07] text-slate-600'
                          : g.saas_subscription_status === 'ACTIVE'
                          ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] border-transparent hover:border-red-500/20'
                          : 'text-earth-clay hover:text-emerald-400 hover:bg-emerald-500/[0.08] border-transparent hover:border-emerald-500/20'
                      }`}
                      title={g.saas_subscription_status === 'ACTIVE' ? 'Suspend branch' : 'Reactivate branch'}
                      aria-label={g.saas_subscription_status === 'ACTIVE' ? 'Suspend branch' : 'Reactivate branch'}
                    >
                      {updatingId === g.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : g.saas_subscription_status === 'ACTIVE' ? (
                        <ShieldAlert size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </button>
                  </div>
                </TableRow>
              ))}
            </Table>
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  );
};

export default SuperAdminDashboard;
