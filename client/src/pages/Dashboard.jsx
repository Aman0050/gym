import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Users, IndianRupee, Activity, AlertCircle,
  TrendingUp, Clock, ArrowRight, CheckCircle2,
  MessageSquare, Zap, ChevronRight,
  UserPlus, Fingerprint, Receipt,
  User, CalendarClock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import socket from '../services/socket';
import { DashboardSkeleton } from '../components/Skeleton';
import { FadeIn, AnimatedCounter, PageTransition } from '../components/Animations';
import { Card, Button, StatusBadge, transitions } from '../components/ui';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();

    socket.on('REVENUE_UPDATE', (payload) => {
      setData((prev) => ({
        ...prev,
        summary: {
          ...prev.summary,
          todayRevenue: (prev.summary.todayRevenue || 0) + parseFloat(payload.amount),
        },
        recentActivity: [
          {
            member_name: payload.memberName || 'Payment Received',
            amount: payload.amount,
            payment_date: new Date(),
          },
          ...prev.recentActivity.slice(0, 4),
        ],
      }));
    });

    return () => { socket.off('REVENUE_UPDATE'); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const { summary, trends, expiringSoon, recentActivity } = data;

  const stats = [
    {
      label: 'Active Members',
      value: summary.activeMembers,
      icon: Activity,
      note: 'Currently active',
    },
    {
      label: "Today's Revenue",
      value: summary.todayRevenue,
      icon: IndianRupee,
      isCurrency: true,
      glow: true,
    },
    {
      label: 'Total Members',
      value: summary.totalMembers,
      icon: Users,
      note: 'All time enrolled',
    },
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
                <span className="label-text">Branch Dashboard</span>
              </div>
              <h1 className="page-title text-ivory">
                Performance{' '}
                <span className="text-earth-clay italic">Summary</span>
              </h1>
              <p className="body-text text-sm opacity-70">
                Real-time operational summary of branch performance and growth.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:flex items-center gap-3">
              <Button
                variant="secondary"
                icon={UserPlus}
                onClick={() => navigate('/members')}
                className="flex-1 sm:flex-none"
              >
                Add Member
              </Button>
              <Button
                variant="secondary"
                icon={Fingerprint}
                onClick={() => navigate('/attendance')}
                className="flex-1 sm:flex-none"
              >
                Attendance
              </Button>
              <Button
                variant="primary"
                icon={Receipt}
                onClick={() => navigate('/payments')}
                className="col-span-2 sm:flex-none"
              >
                Record Payment
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* ── KPI Grid + Chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Left: Stats + Revenue Chart */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {stats.map((stat, idx) => (
                <FadeIn key={stat.label} direction="up" delay={idx * 0.06} duration={0.4}>
                  <Card
                    variant={stat.glow ? 'glow' : 'default'}
                    className="p-6 lg:p-8 flex flex-col justify-between h-40 lg:h-44 overflow-hidden relative group"
                  >
                    {/* Subtle brand accent on hover */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-earth-clay/5 -mr-16 -mt-16 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/[0.07] text-earth-clay relative z-10">
                      <stat.icon size={18} />
                    </div>
                    <div className="relative z-10">
                      <p className="label-text !text-[8px] !text-slate-500 mb-2">{stat.label}</p>
                      <h3 className="text-3xl lg:text-4xl font-black text-ivory leading-none tracking-tight flex items-baseline gap-1">
                        {stat.isCurrency && (
                          <span className="text-emerald-400 text-xl font-black">₹</span>
                        )}
                        <AnimatedCounter value={stat.isCurrency ? summary.todayRevenue : stat.value} />
                      </h3>
                      {stat.note && (
                        <p className="text-[9px] text-slate-600 font-semibold mt-1.5 uppercase tracking-wider">
                          {stat.note}
                        </p>
                      )}
                    </div>
                  </Card>
                </FadeIn>
              ))}
            </div>

            {/* Revenue Chart */}
            <FadeIn delay={0.2} duration={0.5}>
              <Card variant="flat" className="p-6 lg:p-10 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-ivory tracking-tight">Revenue Growth</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Monthly financial performance</p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                    <TrendingUp size={13} />
                    +12.4% MoM
                  </div>
                </div>
                <div className="h-56 lg:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends.revenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#a0522d" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#a0522d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#334155"
                        fontSize={9}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        tick={{ fill: '#475569', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}
                      />
                      <YAxis stroke="#334155" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#475569' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(8,8,8,0.95)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '14px',
                          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                          fontSize: '11px',
                          fontFamily: 'Outfit, sans-serif',
                          padding: '10px 16px',
                        }}
                        itemStyle={{ color: '#a0522d', fontWeight: 800 }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                        cursor={{ stroke: 'rgba(160,82,45,0.2)', strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#a0522d"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#a0522d', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </FadeIn>
          </div>

          {/* Right: Priority Lists */}
          <div className="lg:col-span-4 space-y-6 lg:space-y-8">

            {/* Expiring Soon */}
            <Card variant="flat" className="p-0 overflow-hidden flex flex-col h-80 lg:h-96">
              <div className="px-6 py-5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <CalendarClock size={16} className="text-terracotta" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-ivory">
                    Renewals Due
                  </h3>
                </div>
                {expiringSoon.length > 0 && (
                  <span className="text-[9px] font-black bg-terracotta/10 text-terracotta border border-terracotta/20 px-2.5 py-1 rounded-full">
                    {expiringSoon.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto premium-scrollbar p-4 space-y-2.5">
                {expiringSoon.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-3">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-500">All memberships current</p>
                  </div>
                ) : (
                  expiringSoon.map((m, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(`/members/profile/${m.id}`)}
                      className="bg-white/[0.03] border border-white/[0.06] hover:border-earth-clay/25 p-4 rounded-2xl flex items-center justify-between group cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-terracotta/10 border border-terracotta/15 flex items-center justify-center flex-shrink-0">
                          <User size={13} className="text-terracotta" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-ivory group-hover:text-earth-clay transition-colors truncate">
                            {m.name}
                          </p>
                          <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                            Expires {new Date(m.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-earth-clay flex-shrink-0 ml-2" />
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card variant="flat" className="p-0 overflow-hidden h-80 lg:h-96 flex flex-col">
              <div className="px-6 py-5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-earth-clay" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-ivory">
                    Recent Payments
                  </h3>
                </div>
                <Zap size={13} className="text-earth-clay animate-pulse" />
              </div>

              <div className="flex-1 overflow-y-auto premium-scrollbar p-4 space-y-2">
                {recentActivity.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30">
                    <p className="text-xs text-slate-500 font-semibold">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] rounded-xl group transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 bg-white/[0.04] rounded-lg flex items-center justify-center border border-white/[0.06] flex-shrink-0">
                          <User size={13} className="text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-ivory truncate">{a.member_name}</p>
                          <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-wider mt-0.5">
                            {new Date(a.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-emerald-400 flex-shrink-0 ml-2">
                        ₹{Number(a.amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
