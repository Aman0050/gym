import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import { SOCKET_EVENTS } from '../socket/events';
import { motion } from 'framer-motion';
import {
  Building2, Phone, Calendar, Activity,
  ChevronLeft, Snowflake, Edit2, ShieldAlert, 
  Bell, TrendingUp, History, CreditCard, Users, 
  MapPin, CheckCircle, Mail, Map, Users2, ShieldCheck, IndianRupee
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { Card, Button, StatusBadge, Table, TableRow, Modal, Input } from '../components/ui';
import { FadeIn, PageTransition, AnimatedCounter } from '../components/Animations';
import { ProfileSkeleton } from '../components/Skeleton';

const STATUS_ACCENTS = {
  ACTIVE:   'rgba(16,185,129,0.08)',
  SUSPENDED:'rgba(239,68,68,0.06)',
};

const BranchProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveActivities, setLiveActivities] = useState([]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', contact_person: '' });
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '', type: 'IN_APP' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();
    
    // Setup socket listeners
    socket.on(SOCKET_EVENTS.BRANCH_STATS_UPDATED, handleStatsUpdate);
    socket.on(SOCKET_EVENTS.PAYMENT_CONFIRMED, handleNewActivity);
    socket.on(SOCKET_EVENTS.ATTENDANCE_UPDATE, handleNewActivity);
    socket.on(SOCKET_EVENTS.MEMBER_CREATED, handleNewActivity);

    return () => {
      socket.off(SOCKET_EVENTS.BRANCH_STATS_UPDATED, handleStatsUpdate);
      socket.off(SOCKET_EVENTS.PAYMENT_CONFIRMED, handleNewActivity);
      socket.off(SOCKET_EVENTS.ATTENDANCE_UPDATE, handleNewActivity);
      socket.off(SOCKET_EVENTS.MEMBER_CREATED, handleNewActivity);
    };
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/gyms/${id}/details`);
      setData(res.data);
      // Initialize live activities with latest payments/attendance
      const recent = [
        ...res.data.payments.slice(0,5).map(p => ({ id: `p_${p.id}`, text: `Payment received: ₹${p.amount} from ${p.member_name}`, time: p.payment_date, icon: CreditCard, color: 'text-emerald-400' })),
        ...res.data.attendanceStats.slice(0,5).map((a, i) => ({ id: `a_${i}`, text: `Member checked in`, time: a.check_in_time, icon: Activity, color: 'text-blue-400' }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
      setLiveActivities(recent);
    } catch (err) {
      toast.error('Failed to load branch profile');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatsUpdate = (payload) => { if (payload.gymId === id) fetchProfile(); };
  const handleNewActivity = (payload) => {
    if (payload.gymId === id) {
      setLiveActivities(prev => [{
        id: Date.now(),
        text: payload.message || 'New activity',
        time: new Date().toISOString(),
        icon: Activity,
        color: 'text-emerald-400'
      }, ...prev].slice(0, 10));
    }
  };

  const openEditModal = () => {
    if (data?.branch) {
      setEditForm({
        name: data.branch.name || '',
        phone: data.branch.phone || '',
        address: data.branch.address || '',
        contact_person: data.branch.contact_person || ''
      });
      setShowEditModal(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/gyms/${id}`, editForm);
      toast.success('Branch details updated');
      setShowEditModal(false);
      fetchProfile();
    } catch (err) {
      toast.error('Failed to update branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/gyms/${id}/notify`, notifyForm);
      toast.success('Notification sent to branch');
      setShowNotifyModal(false);
      setNotifyForm({ title: '', message: '', type: 'IN_APP' });
    } catch (err) {
      toast.error('Failed to send notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (status === 'SUSPENDED' && !window.confirm('Are you sure you want to suspend this branch?')) return;
    
    try {
      await api.patch(`/gyms/${id}/status`, { status, reason: status === 'SUSPENDED' ? 'Suspended by admin' : '' });
      toast.success(`Branch ${status === 'ACTIVE' ? 'reactivated' : 'suspended'} successfully`);
      fetchProfile();
    } catch (err) {
      toast.error('Failed to update branch status');
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!data || !data.branch) return null;

  const { branch, revenueStats, membershipStats, attendanceStats, payments, trainers } = data;

  const chartData = (() => {
    const countByDay = {};
    (attendanceStats || []).forEach((a) => {
      const day = new Date(a.check_in_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      countByDay[day] = (countByDay[day] || 0) + 1;
    });
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      days.push({ date: label, visits: countByDay[label] || 0 });
    }
    return days;
  })();

  const statusAccent = STATUS_ACCENTS[branch.saas_subscription_status] || STATUS_ACCENTS.SUSPENDED;

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto pb-safe-area">
        
        {/* Top Header Section */}
        <FadeIn direction="down" duration={0.3}>
          <div className="aura-glass px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.05] transition-all duration-200"
              >
                <div className="w-8 h-8 bg-white/[0.04] rounded-lg flex items-center justify-center border border-white/[0.07] group-hover:border-earth-clay/25">
                  <ChevronLeft size={16} className="text-slate-500 group-hover:text-earth-clay transition-colors" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-ivory transition-colors hidden sm:block">
                  Dashboard
                </span>
              </button>
              <div className="w-px h-6 bg-white/[0.08]" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center border border-white/[0.07]">
                  <Building2 size={18} className="text-earth-clay" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-ivory tracking-tight">{branch.name}</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{branch.location || 'Branch'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-full">
                <Users2 size={14} className="text-earth-clay" />
                <span className="text-xs font-black text-ivory">Occupancy: <span className="text-emerald-400">Low</span></span>
              </div>
              <StatusBadge status={branch.saas_subscription_status} />
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* LEFT PROFILE CARD */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 lg:h-fit lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto premium-scrollbar space-y-6 lg:pr-2">
              <FadeIn direction="left" duration={0.4}>
              <Card variant="flat" className="p-8 lg:p-10 relative overflow-hidden">
                <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{ background: `radial-gradient(circle at 70% 20%, ${statusAccent}, transparent 60%)` }} />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <motion.div whileHover={{ scale: 1.04, rotate: 5 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="w-24 h-24 lg:w-28 lg:h-28 bg-white/[0.06] rounded-[2rem] flex items-center justify-center mb-6 border border-white/[0.1] shadow-xl relative">
                    <Building2 size={40} className="text-earth-clay" />
                  </motion.div>
                  <h2 className="text-2xl lg:text-3xl font-black text-ivory tracking-tight mb-3">{branch.name}</h2>
                  <div className="flex items-center gap-2.5 bg-white/[0.04] px-4 py-2 rounded-2xl border border-white/[0.07] mb-6">
                    <ShieldCheck size={13} className="text-earth-clay" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      ID: {branch.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 space-y-4 pt-6 border-t border-white/[0.06]">
                  {[
                    { label: 'Manager', value: branch.contact_person || 'Unassigned', icon: Users },
                    { label: 'Phone', value: branch.phone || '—', icon: Phone },
                    { label: 'Location', value: branch.location || '—', icon: MapPin },
                    { label: 'Joined', value: new Date(branch.created_at).toLocaleDateString(), icon: Calendar },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <Icon size={13} className="text-earth-clay" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{label}</span>
                      </div>
                      <span className="text-[11px] font-black truncate text-right text-ivory">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="w-full text-[10px]" icon={Edit2} onClick={openEditModal}>Edit Branch</Button>
                  <Button variant="secondary" className="w-full text-[10px]" icon={Bell} onClick={() => setShowNotifyModal(true)}>Notify</Button>
                  {branch.saas_subscription_status === 'ACTIVE' ? (
                    <Button variant="danger" className="w-full col-span-2" icon={ShieldAlert} onClick={() => handleUpdateStatus('SUSPENDED')}>Suspend Branch</Button>
                  ) : (
                    <Button variant="primary" className="w-full col-span-2" icon={CheckCircle} onClick={() => handleUpdateStatus('ACTIVE')}>Reactivate Branch</Button>
                  )}
                </div>
              </Card>
            </FadeIn>
            </div>
          </div>

          {/* RIGHT ANALYTICS SECTION */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* REVENUE & MEMBERSHIP STATS */}
            <FadeIn direction="up" delay={0.1} duration={0.4}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: revenueStats?.total_revenue || 0, icon: IndianRupee, isCurrency: true },
                  { label: 'Monthly Revenue', value: revenueStats?.monthly_revenue || 0, icon: TrendingUp, isCurrency: true },
                  { label: 'Total Members', value: membershipStats?.total || 0, icon: Users },
                  { label: 'Active Members', value: membershipStats?.active || 0, icon: Activity },
                ].map((s, i) => (
                  <Card key={i} variant="flat" className="p-5 flex flex-col justify-between h-32">
                    <div className="flex items-center gap-2 mb-3">
                      <s.icon size={13} className="text-earth-clay" />
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{s.label}</p>
                    </div>
                    <h3 className="text-2xl font-black text-ivory flex items-baseline gap-1">
                      {s.isCurrency && <span className="text-emerald-400 text-sm">₹</span>}
                      <AnimatedCounter value={s.value} />
                    </h3>
                  </Card>
                ))}
              </div>
            </FadeIn>

            {/* ATTENDANCE HISTORY */}
            <FadeIn direction="up" delay={0.15} duration={0.4}>
              <Card variant="flat" className="p-7 lg:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-ivory tracking-tight">Attendance Trend</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Last 30 days of branch check-ins</p>
                  </div>
                  <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center border border-white/[0.07] text-earth-clay">
                    <Activity size={18} />
                  </div>
                </div>

                <div className="h-64 w-full min-h-[350px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAttBranch" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a0522d" stopOpacity={0.5} />
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
                        minTickGap={30}
                        tick={{ fill: '#475569', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }} 
                      />
                      <YAxis 
                        fontSize={9}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                        tick={{ fill: '#475569', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(8,8,8,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '11px' }} 
                        formatter={(val) => [val, 'Check-ins']}
                      />
                      <Area type="monotone" dataKey="visits" stroke="#a0522d" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttBranch)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </FadeIn>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* LIVE ACTIVITY FEED */}
              <FadeIn direction="up" delay={0.2} duration={0.4}>
                <Card variant="flat" className="p-7 h-full flex flex-col">
                  <h3 className="text-sm font-black text-ivory tracking-tight mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Activity Feed
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {liveActivities.length > 0 ? liveActivities.map((act) => (
                      <div key={act.id} className="flex items-start gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                        <div className={`w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0 ${act.color}`}>
                          <act.icon size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ivory">{act.text}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{new Date(act.time).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center opacity-40 py-10">
                        <Activity size={24} className="mb-2" />
                        <p className="text-xs font-semibold">No recent activity</p>
                      </div>
                    )}
                  </div>
                </Card>
              </FadeIn>

              {/* TRAINER OVERVIEW */}
              <FadeIn direction="up" delay={0.25} duration={0.4}>
                <Card variant="flat" className="p-7 h-full">
                  <h3 className="text-sm font-black text-ivory tracking-tight mb-6">Trainer Overview</h3>
                  {trainers && trainers.length > 0 ? (
                    <div className="space-y-4">
                      {/* Render trainers if they exist */}
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center opacity-30 gap-3 border border-dashed border-white/10 rounded-2xl">
                      <Users size={28} className="text-slate-500" />
                      <p className="text-sm font-semibold text-slate-500">No trainers assigned yet</p>
                    </div>
                  )}
                </Card>
              </FadeIn>
            </div>

            {/* PAYMENT HISTORY */}
            <FadeIn direction="up" delay={0.3} duration={0.4}>
              <Card variant="flat" className="p-0 overflow-hidden">
                <div className="px-7 py-5 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History size={16} className="text-earth-clay" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-ivory">Recent Payments</h3>
                  </div>
                </div>
                <Table
                  headers={[
                    { label: 'Date', className: 'w-28 flex-shrink-0' },
                    { label: 'Member', className: 'flex-[1.5]' },
                    { label: 'Plan', className: 'flex-[1.5]' },
                    { label: 'Amount', className: 'flex-1 text-right' },
                  ]}
                  emptyMessage="No payment records found."
                  emptyIcon={CreditCard}
                >
                  {(payments || []).map((p) => (
                    <TableRow key={p.id}>
                      <div className="w-28 flex-shrink-0 text-[11px] font-semibold text-slate-500 uppercase">
                        {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      <div className="flex-[1.5] text-xs font-black text-ivory">{p.member_name}</div>
                      <div className="flex-[1.5] text-[11px] text-slate-400 font-semibold">{p.plan_name}</div>
                      <div className="flex-1 text-sm font-black text-emerald-400 text-right">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </div>
                    </TableRow>
                  ))}
                </Table>
              </Card>
            </FadeIn>

          </div>
        </div>
      </div>

      {/* Edit Branch Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Branch Profile"
        subtitle="Update details for this location"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <Input label="Branch Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
          <Input label="Phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} required />
          <Input label="Manager / Contact" value={editForm.contact_person} onChange={e => setEditForm({ ...editForm, contact_person: e.target.value })} />
          <div className="space-y-3">
            <label className="label-text ml-2">Address</label>
            <textarea
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-ivory text-sm font-bold focus:outline-none focus:border-earth-clay/30 transition-all shadow-inner h-24 placeholder:text-slate-600"
              value={editForm.address}
              onChange={e => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Notify Branch Modal */}
      <Modal
        isOpen={showNotifyModal}
        onClose={() => setShowNotifyModal(false)}
        title="Send Notification"
        subtitle="Alert the branch manager"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleNotifySubmit} className="space-y-6">
          <Input label="Notification Title" value={notifyForm.title} onChange={e => setNotifyForm({ ...notifyForm, title: e.target.value })} required placeholder="e.g. Server Maintenance" />
          <div className="space-y-3">
            <label className="label-text ml-2">Message</label>
            <textarea
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-ivory text-sm font-bold focus:outline-none focus:border-earth-clay/30 transition-all shadow-inner h-32 placeholder:text-slate-600"
              value={notifyForm.message}
              onChange={e => setNotifyForm({ ...notifyForm, message: e.target.value })}
              required
              placeholder="Type your message here..."
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowNotifyModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>Send Notification</Button>
          </div>
        </form>
      </Modal>

    </PageTransition>
  );
};

export default BranchProfile;
