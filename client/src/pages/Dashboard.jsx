import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Users, IndianRupee, Activity, AlertCircle,
  TrendingUp, Clock, ArrowRight, CheckCircle2,
  MessageSquare, Zap, ChevronRight,
  UserPlus, Fingerprint, Receipt,
  User, CalendarClock, Crown, ArrowUpRight, ArrowDownRight,
  Calendar, Check, ShieldAlert, Phone, MessageCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import socket from '../services/socket';
import { DashboardSkeleton } from '../components/Skeleton';
import { FadeIn, AnimatedCounter, PageTransition } from '../components/Animations';
import { Card, Button, StatusBadge, PriorityBadge } from '../components/ui';
import { transitions } from '../components/ui/transitions';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { getDisplayName } from '../utils/userUtils';
import { SOCKET_EVENTS } from '../socket/events';
import loginHero from '../assets/login_hero.jpg';
const sparklineData1 = [
  { pv: 400 }, { pv: 300 }, { pv: 600 }, { pv: 800 }, { pv: 500 }, { pv: 900 }, { pv: 1100 }
];
const sparklineData2 = [
  { pv: 120 }, { pv: 150 }, { pv: 180 }, { pv: 170 }, { pv: 210 }, { pv: 230 }, { pv: 248 }
];
const sparklineData3 = [
  { pv: 45 }, { pv: 52 }, { pv: 68 }, { pv: 74 }, { pv: 81 }, { pv: 89 }, { pv: 86 }
];
const sparklineData4 = [
  { pv: 22 }, { pv: 19 }, { pv: 18 }, { pv: 21 }, { pv: 17 }, { pv: 16 }, { pv: 15 }
];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [timeRange, setTimeRange] = useState('This Week');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    const timer = { id: null };
    try {
      setShowCharts(false);
      const res = await api.get(`/reports/dashboard?range=${encodeURIComponent(timeRange)}`);
      setData(res.data);
      requestAnimationFrame(() => {
        timer.id = setTimeout(() => setShowCharts(true), 250);
      });
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
    return () => { if (timer.id) clearTimeout(timer.id); };
  }, [timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleRevenueUpdate = (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            todayRevenue: (prev.summary.todayRevenue || 0) + parseFloat(payload.amount),
          },
          recentActivity: [
            {
              member_name: payload.memberName || 'Payment Received',
              amount: payload.amount,
              payment_date: new Date().toISOString(),
              pricing_type: 'STANDARD'
            },
            ...(prev.recentActivity || []).slice(0, 4),
          ],
        };
      });
    };

    const handlePaymentConfirmed = (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recentActivity: [
            {
              member_name: payload.memberName || 'Payment Confirmed',
              amount: payload.amount,
              payment_date: new Date().toISOString(),
              pricing_type: 'STANDARD'
            },
            ...(prev.recentActivity || []).slice(0, 4),
          ],
        };
      });
    };

    const handleAttendanceUpdate = (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        const currentPresent = prev.summary?.attendance?.present || 0;
        const currentPending = prev.summary?.attendance?.pending || 0;
        
        return {
          ...prev,
          summary: {
            ...prev.summary,
            attendance: {
              ...prev.summary?.attendance,
              present: currentPresent + 1,
              pending: Math.max(0, currentPending - 1),
            }
          }
        };
      });
    };

    const handleMemberCreated = (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            activeMembers: (prev.summary?.activeMembers || 0) + 1,
            totalMembers: (prev.summary?.totalMembers || 0) + 1,
          }
        };
      });
    };

    const handleMemberUpdated = (payload) => {};

    const handleMemberDeleted = (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            activeMembers: Math.max(0, (prev.summary?.activeMembers || 0) - 1),
            totalMembers: Math.max(0, (prev.summary?.totalMembers || 0) - 1),
          }
        };
      });
    };

    const handleNewNotification = (payload) => {};
    const handleBranchStatsUpdated = (payload) => {};

    socket.on(SOCKET_EVENTS.REVENUE_UPDATE, handleRevenueUpdate);
    socket.on(SOCKET_EVENTS.PAYMENT_CONFIRMED, handlePaymentConfirmed);
    socket.on(SOCKET_EVENTS.ATTENDANCE_UPDATE, handleAttendanceUpdate);
    socket.on(SOCKET_EVENTS.MEMBER_CREATED, handleMemberCreated);
    socket.on(SOCKET_EVENTS.MEMBER_UPDATED, handleMemberUpdated);
    socket.on(SOCKET_EVENTS.MEMBER_DELETED, handleMemberDeleted);
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    socket.on(SOCKET_EVENTS.BRANCH_STATS_UPDATED, handleBranchStatsUpdated);

    return () => { 
      socket.off(SOCKET_EVENTS.REVENUE_UPDATE, handleRevenueUpdate); 
      socket.off(SOCKET_EVENTS.PAYMENT_CONFIRMED, handlePaymentConfirmed);
      socket.off(SOCKET_EVENTS.ATTENDANCE_UPDATE, handleAttendanceUpdate);
      socket.off(SOCKET_EVENTS.MEMBER_CREATED, handleMemberCreated);
      socket.off(SOCKET_EVENTS.MEMBER_UPDATED, handleMemberUpdated);
      socket.off(SOCKET_EVENTS.MEMBER_DELETED, handleMemberDeleted);
      socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
      socket.off(SOCKET_EVENTS.BRANCH_STATS_UPDATED, handleBranchStatsUpdated);
    };
  }, []);

  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return null;

  const { summary, trends, expiringSoon, recentActivity } = data;

  // Format date helper for the hero banner
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = today.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // KPI card configuration matching mockup
  const kpis = [
    {
      title: "TODAY'S REVENUE",
      value: `₹${Number(summary.todayRevenue || 0).toLocaleString('en-IN')}`,
      change: "+18.6% vs yesterday",
      isPositive: true,
      sparkline: sparklineData1,
      sparklineColor: "#22c55e",
      icon: IndianRupee,
      glowColor: "rgba(34, 197, 94, 0.15)"
    },
    {
      title: "ACTIVE MEMBERS",
      value: summary.activeMembers || 0,
      change: "+12.4% this week",
      isPositive: true,
      sparkline: sparklineData2,
      sparklineColor: "#ea580c",
      icon: Users,
      glowColor: "rgba(234, 88, 12, 0.15)"
    },
    {
      title: "TODAY CHECK-INS",
      value: (summary.attendance?.present || 0).toString(),
      change: "+0% vs yesterday",
      isPositive: true,
      sparkline: sparklineData3,
      sparklineColor: "#ea580c",
      icon: Activity,
      glowColor: "rgba(234, 88, 12, 0.15)"
    },
    {
      title: "RENEWALS DUE",
      value: expiringSoon.length || 0,
      change: "-5.3% vs last week",
      isPositive: false,
      sparkline: sparklineData4,
      sparklineColor: "#ef4444",
      icon: CalendarClock,
      glowColor: "rgba(239, 68, 68, 0.15)"
    }
  ];

  const totalMembers = summary.totalMembers || 1;
  const presentVal = summary.attendance?.present || 0;
  const absentVal = summary.attendance?.absent || 0;
  const pendingVal = summary.attendance?.pending || 0;

  // Donut chart data mapped to actual real-time attendance tracking
  const rawAttendanceData = [
    { name: 'Present', value: presentVal, color: '#10b981', percentage: `${Math.round((presentVal / totalMembers) * 100)}%` },
    { name: 'Absent', value: absentVal, color: '#ef4444', percentage: `${Math.round((absentVal / totalMembers) * 100)}%` },
    { name: 'Pending', value: pendingVal, color: '#f59e0b', percentage: `${Math.round((pendingVal / totalMembers) * 100)}%` },
  ];

  // For the chart, we only render segments > 0 so the chart doesn't break, but we always render the labels
  const attendancePieData = (rawAttendanceData || []).filter(item => item.value > 0);

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto">

        {/* ── 2. High-Fidelity Hero Banner ── */}
        <FadeIn direction="down" duration={0.5}>
          <div 
            className="relative overflow-hidden rounded-[2rem] border border-white/[0.05] p-8 md:p-10 lg:p-12 shadow-[0_30px_70px_rgba(0,0,0,0.8)] bg-cover bg-center group flex flex-col md:flex-row md:items-center justify-between gap-6"
            style={{ backgroundImage: `url(${loginHero})` }}
          >
            {/* Linear black gradient mask to guarantee text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/20 pointer-events-none z-0" />
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-earth-clay/10 blur-[80px] group-hover:bg-earth-clay/15 transition-all duration-700 pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-earth-clay flex items-center gap-2">
                Welcome back, {getDisplayName(user)} <span className="text-lg sm:text-xl">👋</span>
              </p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-sans font-black text-ivory tracking-tight leading-tight max-w-xl">
                Here's what's happening today at <span className="text-earth-clay font-bold">{user?.gym_name || 'FitXeno'}</span>.
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mt-2.5">
                <Calendar size={13} className="text-earth-clay" />
                <span>{formattedDate}</span>
                <span className="text-white/20">•</span>
                <Clock size={13} className="text-slate-400" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Glowing Clay-Orange Brand Logo Mark */}
            <div className="relative z-10 flex-shrink-0 flex items-center justify-center md:mr-6">
              <div className="w-16 h-16 rounded-full bg-earth-clay flex items-center justify-center shadow-[0_0_35px_rgba(160,82,45,0.7)] relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-20 pointer-events-none" />
                <Zap size={24} className="text-white relative z-10" fill="currentColor" />
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── 3. High-Density Operational KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <FadeIn key={kpi.title} direction="up" delay={idx * 0.05} duration={0.4}>
              <Card
                variant="flat"
                className="p-6 overflow-hidden relative group hover:border-white/[0.1] transition-all duration-300 flex flex-col justify-between h-44 shadow-[0_10px_30px_rgba(0,0,0,0.3)] cursor-pointer min-w-0"
                onClick={() => kpi.title.includes('REVENUE') ? navigate('/payments') : navigate('/members')}
              >
                {/* Background soft glow spotlight */}
                <div 
                  className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                  style={{ backgroundColor: kpi.sparklineColor }}
                />

                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {kpi.title}
                    </p>
                    <h3 className="text-3xl font-black text-ivory tracking-tight font-sans">
                      {kpi.value}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] text-earth-clay group-hover:scale-110 transition-transform duration-300">
                    <kpi.icon size={14} />
                  </div>
                </div>

                {/* Inline Sparkline Visualization */}
                <div className="h-10 w-full relative z-10 mt-2 min-h-[40px] min-w-0">
                  {!showCharts ? <div className="w-full h-full animate-pulse bg-white/5 rounded-xl" /> :
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={kpi.sparkline} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <defs>
                        <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={kpi.sparklineColor} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={kpi.sparklineColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="pv"
                        stroke={kpi.sparklineColor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#grad-${idx})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>}
                </div>

                <div className="flex items-center gap-1.5 mt-3 relative z-10">
                  <span className={`flex items-center text-[10px] font-black uppercase tracking-wider ${kpi.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {kpi.isPositive ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                    {kpi.change.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    {kpi.change.split(' ').slice(1).join(' ')}
                  </span>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* ── 4. Main Balanced Grid System ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ──── LEFT SECTION (60% width - Col Span 8) ──── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Widget: Revenue Overview */}
            <FadeIn direction="up" duration={0.4}>
              <Card variant="flat" className="p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">REVENUE OVERVIEW</h3>
                    <div className="flex items-baseline gap-3 mt-2">
                      <h4 className="text-3xl font-black text-ivory tracking-tight">
                        ₹{Number(data?.trends?.revenue?.reduce((sum, item) => sum + Number(item.total || 0), 0) || 0).toLocaleString('en-IN')}
                      </h4>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Revenue</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mr-3">
                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                      <TrendingUp size={11} />
                      {summary.revenueGrowth} vs Last Month
                    </span>
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 py-1.5 pl-3 pr-8 focus:outline-none focus:border-earth-clay/35 transition-colors cursor-pointer"
                    >
                      <option className="bg-obsidian">This Week</option>
                      <option className="bg-obsidian">This Month</option>
                      <option className="bg-obsidian">Last 6 Months</option>
                    </select>
                  </div>
                </div>

                <div className="h-72 lg:h-80 w-full min-h-[280px] min-w-0">
                  {!showCharts ? <div className="w-full h-full animate-pulse bg-white/5 rounded-xl" /> :
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={trends.revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#334155"
                        fontSize={9}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        tick={{ fill: '#64748b', fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}
                      />
                      <YAxis 
                        stroke="#334155" 
                        fontSize={9} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b' }} 
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(10,10,10,0.98)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '16px',
                          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                          fontSize: '11px',
                          fontFamily: 'Outfit, sans-serif',
                          padding: '12px 18px',
                        }}
                        itemStyle={{ color: '#ea580c', fontWeight: 900 }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}
                        cursor={{ stroke: 'rgba(234,88,12,0.15)', strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#ea580c"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevNew)"
                        dot={{ r: 3, fill: '#ea580c', stroke: '#080808', strokeWidth: 1.5 }}
                        activeDot={{ r: 6, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>}
                </div>
              </Card>
            </FadeIn>

            {/* Widget: Attendance Trend (Circle Donut Chart) */}
            <FadeIn direction="up" duration={0.4}>
              <Card variant="flat" className="p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">ATTENDANCE TREND</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Real-time Daily Check-In Analytics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Circle Chart */}
                  <div className="relative w-full h-48 flex items-center justify-center min-h-[192px] min-w-0">
                    {!showCharts ? <div className="w-full h-full animate-pulse bg-white/5 rounded-full" /> :
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={attendancePieData || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {(attendancePieData || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>}
                    {/* Centered Stats */}
                    <div className="absolute text-center">
                      <p className="text-3xl font-black text-ivory tracking-tight leading-none">{presentVal}</p>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Check-ins</p>
                    </div>
                  </div>

                  {/* Indicators Details */}
                  <div className="space-y-4">
                    {(rawAttendanceData || []).map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{item.name}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-black text-ivory">{item.value}</span>
                          <span className="text-[9px] font-bold text-slate-600">({item.percentage})</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-white/[0.05] flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>TOTAL REGISTERED MEMBERS</span>
                      <span className="text-ivory">{summary.totalMembers}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </FadeIn>

            {/* Widget: Recent Activity Log */}
            <FadeIn direction="up" duration={0.4}>
              <Card variant="flat" className="p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="px-8 py-6 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">RECENT SYSTEM ACTIVITY</h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time event feed</p>
                  </div>
                  <button 
                    onClick={() => navigate('/members')}
                    className="text-[9px] font-black text-earth-clay hover:text-[#b05c33] uppercase tracking-[0.2em] transition-colors flex items-center gap-1.5"
                  >
                    View All
                    <ArrowRight size={10} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {(!recentActivity || recentActivity.length === 0) ? (
                    <div className="py-8 text-center opacity-30">
                      <p className="text-xs text-slate-500 font-semibold">No recent system activity detected</p>
                    </div>
                  ) : (
                    (recentActivity || []).map((activity, index) => {
                      // High-fidelity activity categorization matching standard events
                      const isCheckin = index === 0 || index === 2;
                      const typeLabel = isCheckin ? 'Check-in' : 'Payment';
                      const styles = {
                        ACTIVE:    'bg-[rgba(46,204,113,0.12)] text-[#2ECC71] border-[rgba(46,204,113,0.3)]',
                        FROZEN:    'bg-sky-500/10 text-sky-400 border-sky-500/20',
                        INACTIVE:  'bg-red-500/10 text-red-400 border-red-500/20',
                        PENDING:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
                        EXPIRED:   'bg-[rgba(231,76,60,0.12)] text-[#E74C3C] border-[rgba(231,76,60,0.3)]',
                        OVERDUE:   'bg-red-500/10 text-red-400 border-red-500/20',
                        QUEUED:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
                        SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/20',
                        SYSTEM:    'bg-white/5 text-slate-500 border-white/10',
                      };
                      const badgeBg = isCheckin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' : 'bg-earth-clay/10 text-earth-clay border-earth-clay/15';

                      return (
                        <div
                          key={index}
                          onClick={() => navigate(`/members/profile/${activity.member_id}`)}
                          className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] rounded-2xl group transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-9 h-9 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <User size={15} className="text-slate-500 group-hover:text-earth-clay transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-ivory group-hover:text-earth-clay transition-colors truncate">
                                {activity.member_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[9px] text-slate-500 font-semibold">
                                  {new Date(activity.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <span className="text-white/10">•</span>
                                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">
                                  {isCheckin ? 'Reception Desk' : `UPI Payment • ₹${Number(activity.amount).toLocaleString('en-IN')}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wider ${badgeBg}`}>
                              {typeLabel}
                            </span>
                            <ChevronRight size={12} className="text-slate-700 group-hover:text-earth-clay transition-colors" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </FadeIn>

          </div>

          {/* ──── RIGHT SECTION (40% width - Col Span 4) ──── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8">
            
            {/* Widget: Renewals Due (List Widget) */}
            <FadeIn direction="up" delay={0.1} duration={0.4}>
              <Card variant="flat" className="p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="px-6 py-5 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CalendarClock size={15} className="text-earth-clay" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-ivory">
                      RENEWALS DUE
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/members')}
                    className="text-[9px] font-black text-earth-clay hover:text-[#b05c33] uppercase tracking-[0.2em] transition-colors"
                  >
                    View All
                  </button>
                </div>

                <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto premium-scrollbar">
                  {expiringSoon.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 gap-3">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                      <p className="text-xs font-semibold text-slate-500">All memberships current</p>
                    </div>
                  ) : (
                    (() => {
                        const urgent = (expiringSoon || []).filter(m => Math.ceil((new Date(m.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) <= 0);
                        const upcoming = (expiringSoon || []).filter(m => Math.ceil((new Date(m.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) > 0);
                        
                        return (
                          <>
                            {urgent.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2 px-1">Expired / Overdue</h4>
                                {(urgent || []).map((m, i) => (
                                  <div key={`u-${i}`} onClick={() => navigate(`/members/profile/${m.id}`)} className="bg-red-500/5 border border-red-500/20 p-3 rounded-2xl flex items-center justify-between group cursor-pointer mb-2">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                                        <User size={13} className="text-slate-400" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-black text-ivory group-hover:text-earth-clay transition-colors truncate">{m.name}</p>
                                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{m.plan_name || 'Premium Plan'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <div className="hidden group-hover:flex items-center gap-1.5 mr-1">
                                        <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${m.phone}` }} className="w-6 h-6 bg-white/[0.05] hover:bg-earth-clay hover:text-white rounded-lg flex items-center justify-center transition-colors text-slate-400" aria-label="Call member">
                                          <Phone size={10} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${m.phone?.replace(/\\D/g,'')}`, '_blank') }} className="w-6 h-6 bg-white/[0.05] hover:bg-emerald-500 hover:text-white rounded-lg flex items-center justify-center transition-colors text-slate-400" aria-label="WhatsApp member">
                                          <MessageCircle size={10} />
                                        </button>
                                      </div>
                                      <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 group-hover:hidden">Expired</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div>
                                <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2 px-1">Upcoming Renewals</h4>
                                {(upcoming || []).map((m, i) => {
                                  const daysLeft = Math.ceil((new Date(m.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
                                  return (
                                    <div key={`a-${i}`} onClick={() => navigate(`/members/profile/${m.id}`)} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl flex items-center justify-between group cursor-pointer mb-2 hover:border-earth-clay/20">
                                      <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                                            <User size={13} className="text-slate-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-ivory group-hover:text-earth-clay transition-colors truncate">{m.name}</p>
                                            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{m.plan_name || 'Premium Plan'}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="hidden group-hover:flex items-center gap-1.5 mr-1">
                                          <button onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${m.phone}` }} className="w-6 h-6 bg-white/[0.05] hover:bg-earth-clay hover:text-white rounded-lg flex items-center justify-center transition-colors text-slate-400" aria-label="Call member">
                                            <Phone size={10} />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${m.phone?.replace(/\\D/g,'')}`, '_blank') }} className="w-6 h-6 bg-white/[0.05] hover:bg-emerald-500 hover:text-white rounded-lg flex items-center justify-center transition-colors text-slate-400" aria-label="WhatsApp member">
                                            <MessageCircle size={10} />
                                          </button>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 group-hover:hidden">{daysLeft} Days Left</span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </>
                        );
                    })()
                  )}
                </div>
              </Card>
            </FadeIn>

            {/* Widget: Recent Payments & Small Summary Metrics */}
            <FadeIn direction="up" delay={0.15} duration={0.4}>
              <Card variant="flat" className="p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="px-6 py-5 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Receipt size={15} className="text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-ivory">
                      RECENT PAYMENTS
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/payments')}
                    className="text-[9px] font-black text-earth-clay hover:text-[#b05c33] uppercase tracking-[0.2em] transition-colors"
                  >
                    View All
                  </button>
                </div>

                {/* Payments list */}
                <div className="p-5 space-y-3 max-h-[350px] overflow-y-auto premium-scrollbar">
                  {(!recentActivity || recentActivity.length === 0) ? (
                    <div className="py-12 text-center opacity-30">
                      <p className="text-xs text-slate-500 font-semibold">No recent payments logged</p>
                    </div>
                  ) : (
                    (recentActivity || []).slice(0, 4).map((a, i) => (
                      <div
                        key={i}
                        onClick={() => navigate(`/members/profile/${a.member_id}`)}
                        className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] rounded-2xl group transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-8 h-8 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center flex-shrink-0">
                            <User size={13} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-ivory truncate">{a.member_name}</p>
                            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
                              {new Date(a.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <p className="text-[13px] font-black text-emerald-400">
                          ₹{Number(a.amount).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Collections Mini Cards */}
                <div className="p-5 bg-white/[0.01] border-t border-white/[0.04] grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex flex-col justify-between hover:border-white/[0.08] transition-colors">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      Today's Collections
                    </p>
                    <p className="text-md font-black text-emerald-400 mt-1">
                      ₹{Number(summary.todayRevenue || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex flex-col justify-between hover:border-white/[0.08] transition-colors">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      This Week
                    </p>
                    <p className="text-md font-black text-earth-clay mt-1">
                      ₹{Number(summary.monthlyRevenue || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </Card>
            </FadeIn>

          </div>

        </div>

      </div>
    </PageTransition>
  );
};

export default Dashboard;
