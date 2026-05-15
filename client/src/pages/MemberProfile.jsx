import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  User, Phone, Calendar, Activity,
  ChevronLeft, Snowflake, Sun, ShieldCheck,
  TrendingUp, History, CreditCard,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { Card, Button, StatusBadge, Table, TableRow } from '../components/ui';
import { FadeIn, PageTransition, AnimatedCounter } from '../components/Animations';
import { ProfileSkeleton } from '../components/Skeleton';

const STATUS_ACCENTS = {
  ACTIVE:   'rgba(16,185,129,0.08)',
  FROZEN:   'rgba(56,189,248,0.08)',
  INACTIVE: 'rgba(239,68,68,0.06)',
  PENDING:  'rgba(245,158,11,0.06)',
};

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/members/profile/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load member profile');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async () => {
    try {
      await api.post(`/members/${id}/freeze`);
      toast.success('Membership frozen successfully');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to freeze membership');
    }
  };

  const handleUnfreeze = async () => {
    try {
      const res = await api.post(`/members/${id}/unfreeze`);
      toast.success(res.data.message || 'Membership reactivated');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unfreeze membership');
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!data) return null;

  const { profile, payments, attendance } = data;

  // Build chart data from last 12 attendance records
  const chartData = (() => {
    const last = [...attendance].slice(0, 12).reverse();
    return last.map((a) => ({
      date: new Date(a.check_in_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      visits: 1,
    }));
  })();

  const statusAccent = STATUS_ACCENTS[profile.status] || STATUS_ACCENTS.INACTIVE;

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto pb-safe-area">

        {/* ── Breadcrumb Navigation ── */}
        <FadeIn direction="down" duration={0.3}>
          <div className="aura-glass px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/members')}
              className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.05] transition-all duration-200"
            >
              <div className="w-8 h-8 bg-white/[0.04] rounded-lg flex items-center justify-center border border-white/[0.07] group-hover:border-earth-clay/25">
                <ChevronLeft size={16} className="text-slate-500 group-hover:text-earth-clay transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-ivory transition-colors hidden sm:block">
                Back to Members
              </span>
            </button>

            <div className="flex items-center gap-2.5 bg-white/[0.04] px-4 py-2 rounded-full border border-white/[0.07]">
              <StatusBadge status={profile.status} />
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Identity Panel — Left Column ── */}
          <div className="lg:col-span-4 space-y-6">
            <FadeIn direction="left" duration={0.4}>
              <Card variant="flat" className="p-8 lg:p-10 relative overflow-hidden">
                {/* Status-driven ambient glow */}
                <div
                  className="absolute inset-0 rounded-[inherit] pointer-events-none"
                  style={{ background: `radial-gradient(circle at 70% 20%, ${statusAccent}, transparent 60%)` }}
                />

                {/* Avatar */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.04, rotate: 8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-24 h-24 lg:w-28 lg:h-28 bg-white/[0.06] rounded-[2rem] flex items-center justify-center mb-6 border border-white/[0.1] shadow-xl relative"
                  >
                    <User size={40} className="text-earth-clay" />
                  </motion.div>

                  <h2 className="text-2xl lg:text-3xl font-black text-ivory tracking-tight mb-3">
                    {profile.name}
                  </h2>

                  <div className="flex items-center gap-2.5 bg-white/[0.04] px-4 py-2 rounded-2xl border border-white/[0.07] mb-6">
                    <ShieldCheck size={13} className="text-earth-clay" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      ID: {profile.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Info rows */}
                <div className="relative z-10 space-y-4 pt-6 border-t border-white/[0.06]">
                  {[
                    { label: 'Phone',      value: profile.phone,                    icon: Phone },
                    { label: 'Joined',     value: new Date(profile.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), icon: Calendar },
                    { label: 'Blood Group', value: profile.blood_group || '—',      icon: Activity, accent: true },
                    { label: 'Emergency',  value: profile.emergency_contact || '—', icon: Phone },
                  ].map(({ label, value, icon: Icon, accent }) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <Icon size={13} className="text-earth-clay" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{label}</span>
                      </div>
                      <span className={`text-[11px] font-black truncate text-right ${accent ? 'text-earth-clay italic' : 'text-ivory'}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="relative z-10 mt-8 pt-6 border-t border-white/[0.06]">
                  {profile.status === 'ACTIVE' || profile.status === 'PENDING' ? (
                    <Button
                      variant="secondary"
                      onClick={handleFreeze}
                      className="w-full group"
                      icon={Snowflake}
                    >
                      Freeze Membership
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleUnfreeze}
                      className="w-full"
                      icon={Sun}
                    >
                      Reactivate Membership
                    </Button>
                  )}
                </div>
              </Card>
            </FadeIn>

            {/* Quick Metrics */}
            <FadeIn direction="up" delay={0.1} duration={0.4}>
              <Card variant="flat" className="p-7">
                <h3 className="label-text !text-slate-400 mb-6 uppercase tracking-widest">
                  Membership Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total Visits', value: attendance.length, icon: Activity },
                    { label: 'Payments',     value: payments.length,   icon: CreditCard },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={13} className="text-earth-clay" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
                      </div>
                      <p className="text-3xl font-black font-serif text-earth-clay leading-none">
                        <AnimatedCounter value={value} />
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          </div>

          {/* ── Details Panel — Right Column ── */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">

            {/* Attendance Chart */}
            <FadeIn direction="up" duration={0.4}>
              <Card variant="flat" className="p-7 lg:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-ivory tracking-tight">Attendance History</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Last {Math.min(attendance.length, 12)} check-ins
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center border border-white/[0.07] text-earth-clay">
                    <TrendingUp size={18} />
                  </div>
                </div>

                {chartData.length > 0 ? (
                  <div className="h-52 lg:h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#a0522d" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#a0522d" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          fontSize={9}
                          axisLine={false}
                          tickLine={false}
                          dy={8}
                          tick={{ fill: '#475569', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(8,8,8,0.95)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontFamily: 'Outfit, sans-serif',
                            padding: '8px 14px',
                          }}
                          itemStyle={{ color: '#a0522d', fontWeight: 800 }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                          formatter={(val) => ['Present', '']}
                        />
                        <Area
                          type="monotone"
                          dataKey="visits"
                          stroke="#a0522d"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorAtt)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#a0522d', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center opacity-30 gap-3">
                    <Activity size={28} className="text-slate-500" />
                    <p className="text-sm font-semibold text-slate-500">No attendance records yet</p>
                  </div>
                )}
              </Card>
            </FadeIn>

            {/* Payment History */}
            <FadeIn direction="up" delay={0.15} duration={0.4}>
              <Card variant="flat" className="p-0 overflow-hidden">
                <div className="px-7 py-5 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History size={16} className="text-earth-clay" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-ivory">
                      Payment History
                    </h3>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    {payments.length} Record{payments.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <Table
                  headers={[
                    { label: 'Date',    className: 'w-28 flex-shrink-0' },
                    { label: 'Plan',    className: 'flex-[2]' },
                    { label: 'Amount',  className: 'flex-1' },
                    { label: 'Method',  className: 'w-28 text-right' },
                  ]}
                  emptyMessage="No payment records found for this member."
                  emptyIcon={<CreditCard size={22} className="text-slate-600" />}
                >
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <div className="w-28 flex-shrink-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      <div className="flex-[2]">
                        <p className="text-xs font-black text-ivory tracking-tight">{p.plan_name}</p>
                        <p className="text-[9px] text-slate-600 font-semibold mt-0.5">
                          {new Date(p.valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' — '}
                          {new Date(p.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex-1 text-sm font-black text-emerald-400">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </div>
                      <div className="w-28 text-right">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          {p.payment_mode || 'Online'}
                        </span>
                      </div>
                    </TableRow>
                  ))}
                </Table>
              </Card>
            </FadeIn>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MemberProfile;
