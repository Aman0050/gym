import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import getErrorMessage from '../utils/getErrorMessage';
import { 
  UserCheck, Search, ShieldCheck, Activity, 
  CheckCircle2, Snowflake, User, Sun, CreditCard, 
  IndianRupee, Calendar, ExternalLink, Clock, Award, AlertTriangle
} from 'lucide-react';
import { Card, Button, Input, Modal, StatusBadge } from '../components/ui';
import { FadeIn, PageTransition } from '../components/Animations';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Attendance = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Persist last checked-in member permanently in state & localStorage
  const [lastCheckin, setLastCheckin] = useState(() => {
    const saved = localStorage.getItem('last_checkin');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (lastCheckin) {
      localStorage.setItem('last_checkin', JSON.stringify(lastCheckin));
    }
  }, [lastCheckin]);

  // Resolution Modal State
  const [resolutionData, setResolutionData] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  const inputRef = React.useRef(null);

  useEffect(() => {
    // Keep focus on input for fast manual entries/barcode scans
    const timer = setInterval(() => {
      if (inputRef.current && !loading && !resolutionData) {
        inputRef.current.focus();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, resolutionData]);

  const handleCheckin = async (memberId) => {
    if (loading || !memberId) return;
    setLoading(true);
    try {
      const res = await api.post('/attendance/check-in', { memberId });
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      setLastCheckin(res.data);
      setManualId('');
      setResolutionData(null);
      toast.success(`Check-in successful for ${res.data.member?.name || 'Member'}`);
    } catch (err) {
      const data = err.response?.data;

      if (data?.isBlocked && data.memberData) {
        // Always store error as a plain string inside memberData
        const errorStr = typeof data.error === 'string'
          ? data.error
          : getErrorMessage(data.error);
        setResolutionData({
          ...data.memberData,
          error: errorStr,
          blockCode: data.blockCode || null,
        });
      } else {
        const errorMsg = typeof data?.error === 'string'
          ? data.error
          : getErrorMessage(err);
        toast.error(errorMsg, { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!resolutionData) return;
    setIsResolving(true);
    try {
      await api.post(`/members/${resolutionData.id}/unfreeze`);
      toast.success('Membership reactivated instantly');
      // Retry check-in
      await handleCheckin(resolutionData.id);
    } catch (err) {
      toast.error('Reactivation failed. Please use Member Profile.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <PageTransition className="h-[calc(100vh-3rem)] flex flex-col">
      <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 min-h-0 pt-2 lg:pt-4">

        {/* ── Page Header ── */}
        <FadeIn direction="down" duration={0.4}>
          <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center gap-6 mb-2">
              <div className="w-12 h-px bg-earth-clay/30" />
              <span className="label-text text-earth-clay tracking-[0.2em] font-black uppercase text-[10px]">Ready for member verification</span>
              <div className="w-12 h-px bg-earth-clay/30" />
            </div>
            <h1 className="page-title text-ivory">
              Reception <span className="text-earth-clay italic">Console</span>
            </h1>
            <p className="body-text opacity-60 max-w-[32rem] mx-auto text-sm leading-relaxed">
              Verify member credentials, monitor check-in status, and manage access logs in real time.
            </p>
          </div>
        </FadeIn>

        {/* ── Symmetrical 2-Column Split Console Grid ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-stretch pb-6">
          
          {/* LEFT SIDE: manual attendance entry card */}
          <div className="flex flex-col min-h-0 h-full">
            <Card variant="flat" className="p-6 lg:p-8 flex flex-col justify-between h-full min-h-0">
              <div>
                <h2 className="text-lg font-black text-ivory flex items-center gap-2.5 mb-8">
                  <Search className="text-earth-clay" size={20} />
                  Manual Check-In
                </h2>

                <div className="space-y-6">
                  <Input
                    ref={inputRef}
                    label="Member ID or Mobile Number"
                    placeholder="Enter member ID or mobile number..."
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    icon={ShieldCheck}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualId && !loading) handleCheckin(manualId);
                    }}
                  />
                  <Button
                    onClick={() => handleCheckin(manualId)}
                    disabled={loading || !manualId.trim()}
                    loading={loading}
                    className="w-full h-14 !text-base !font-black !rounded-2xl shadow-xl shadow-earth-clay/10"
                    icon={UserCheck}
                  >
                    {loading ? 'Verifying Member...' : 'Verify & Check In'}
                  </Button>
                </div>
              </div>

              {/* Enterprise Status indicators */}
              <div className="pt-6 border-t border-white/[0.05] mt-10 flex items-center justify-around text-[9px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400">Stable Link</span>
                </div>
                <div className="w-px h-3 bg-white/[0.08]" />
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400">Real-Time Sync</span>
                </div>
                <div className="w-px h-3 bg-white/[0.08]" />
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  <span className="text-emerald-400">Console Active</span>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT SIDE: Persistent live verification console */}
          <div className="flex flex-col h-full">
            <AnimatePresence mode="wait">
              {lastCheckin ? (
                // ── Persistent Successful Member Verification Card ──
                <motion.div
                  key={lastCheckin.attendance?.id || lastCheckin.member?.id || 'checkedin'}
                  initial={{ opacity: 0, scale: 0.97, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="aura-glass p-6 lg:p-8 border border-emerald-500/15 bg-emerald-500/[0.01] shadow-2xl rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between h-full min-h-0 group"
                >
                  {/* Atmospheric Glow Backdrops */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-earth-clay/5 blur-[120px] rounded-full pointer-events-none" />

                  {/* Header Row */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.05] mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em]">
                        Live Verification Console
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lastCheckin.member?.status || lastCheckin.attendance?.status || 'ACTIVE'} />
                    </div>
                  </div>

                  {/* Center Profile Hub */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="relative w-24 h-24 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-earth-clay shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-30 pointer-events-none" />
                      <User size={36} className="text-earth-clay" />
                      <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-25" />
                    </div>

                    {/* Member Name */}
                    <h3 className="text-2xl lg:text-3xl font-black text-ivory tracking-tight leading-none text-center mt-5 mb-2.5">
                      {lastCheckin.member?.name || lastCheckin.attendance?.name}
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">
                      Member ID: {(lastCheckin.member?.id || lastCheckin.attendance?.member_id || lastCheckin.attendance?.id || '1000').substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Metadata Rows */}
                  <div className="space-y-4 mb-6">
                    
                    {/* Row 1: Plan Details */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center text-earth-clay shadow-inner flex-shrink-0">
                          <Award size={18} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Membership Plan</p>
                          <h4 className="text-[13px] font-black text-ivory tracking-tight">
                            {lastCheckin.member?.plan_name || lastCheckin.attendance?.plan_name || lastCheckin.member?.planName || 'Gym Membership'}
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {lastCheckin.member?.plan_duration || lastCheckin.attendance?.plan_duration || 'Active Plan'}
                      </span>
                    </div>

                    {/* Row 2: Validity */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center text-earth-clay shadow-inner flex-shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Membership Validity</p>
                          <div className="flex items-center gap-1.5 text-[12px] font-black text-ivory">
                            <span className="text-slate-400">
                              {lastCheckin.member?.valid_from || lastCheckin.attendance?.valid_from
                                ? new Date(lastCheckin.member?.valid_from || lastCheckin.attendance?.valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                : 'N/A'
                              }
                            </span>
                            <span className="text-slate-600">➔</span>
                            <span className="text-earth-clay">
                              {lastCheckin.member?.valid_until || lastCheckin.attendance?.valid_until
                                ? new Date(lastCheckin.member?.valid_until || lastCheckin.attendance?.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Check-in Time */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center text-earth-clay shadow-inner flex-shrink-0">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Check-in Timestamp</p>
                          <h4 className="text-[13px] font-black text-emerald-400 tracking-tight">
                            {lastCheckin.attendance?.check_in_time 
                              ? new Date(lastCheckin.attendance.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            }
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Verified
                      </span>
                    </div>

                  </div>

                  {/* Bottom Meta Status Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/[0.05] text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-earth-clay" />
                      <span>Recorded Live</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Console Synced</span>
                    </div>
                  </div>

                </motion.div>
              ) : (
                // ── Pulsing Console Radar Placeholder ──
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="aura-glass p-6 lg:p-8 border border-white/[0.05] bg-[#0c0c0c]/85 shadow-2xl rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between h-full min-h-0 text-center group animate-pulse-slow"
                >
                  <div className="absolute top-0 right-0 w-80 h-80 bg-earth-clay/5 blur-[120px] rounded-full pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

                  {/* Header */}
                  <div className="w-full flex items-center justify-between pb-4 border-b border-white/[0.05] mb-6">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-400 tracking-[0.25em] uppercase">
                        Live Verification Console
                      </span>
                    </div>
                    <span className="text-[8px] bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full font-black text-slate-400 uppercase tracking-widest">
                      Ready
                    </span>
                  </div>

                  {/* Center Radar Icon */}
                  <div className="w-full flex flex-col items-center justify-center my-auto space-y-6">
                    <div className="relative w-28 h-28 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-500 relative overflow-hidden shadow-2xl">
                      <Activity size={36} className="text-earth-clay animate-pulse" />
                      <div className="absolute inset-0 rounded-full border border-earth-clay/20 animate-ping opacity-15" />
                    </div>
                    
                    <div className="w-full space-y-2">
                      <h4 className="text-xl font-black text-ivory tracking-tight">
                        Reception Console Ready
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold max-w-[20rem] leading-relaxed mx-auto">
                        Enter a member ID or mobile number to begin attendance verification.
                      </p>
                    </div>

                    <span className="text-[9px] bg-earth-clay/10 border border-earth-clay/20 text-earth-clay px-3 py-1 rounded-full font-black uppercase tracking-widest">
                      Awaiting Member Verification
                    </span>
                  </div>

                  {/* Footer status indicator */}
                  <div className="w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-600 pt-4 border-t border-white/[0.05]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Station Listening on Real-Time Channels</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* ── Resolution Modal (Frozen/Expired Workflow) ── */}
      <Modal
        isOpen={!!resolutionData}
        onClose={() => setResolutionData(null)}
        title="Check-In Resolution"
        subtitle="Membership Status Intervention Required"
        maxWidth="max-w-xl"
      >
        {resolutionData && (
          <div className="space-y-8">
            {/* 1. Member Profile Preview */}
            <div className="flex items-center gap-6 p-6 bg-white/[0.03] border border-white/[0.06] rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 bg-white/[0.05] border border-white/[0.08] rounded-[1.8rem] flex items-center justify-center text-earth-clay shadow-xl">
                <User size={32} />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-black text-ivory tracking-tight">{resolutionData.name}</h4>
                <div className="flex items-center gap-2 mt-1.5 opacity-60">
                  <ShieldCheck size={11} className="text-earth-clay" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID: {resolutionData.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="mt-3">
                  <StatusBadge status={resolutionData.status} />
                </div>
              </div>
            </div>

            {/* 2. Intelligent Messaging */}
            <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4 shadow-inner">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                resolutionData.blockCode === 'PAYMENT_PENDING'
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                {resolutionData.blockCode === 'PAYMENT_PENDING'
                  ? <CreditCard size={20} />
                  : <Snowflake size={20} />}
              </div>
              <div>
                <p className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${
                  resolutionData.blockCode === 'PAYMENT_PENDING' ? 'text-orange-400' : 'text-amber-500'
                }`}>Action Required</p>
                <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                  {typeof resolutionData.error === 'string'
                    ? resolutionData.error
                    : 'Check-in unavailable until membership is reactivated.'}
                </p>
                {resolutionData.freeze_notes && (
                  <p className="mt-2 p-3 bg-black/20 rounded-xl text-[10px] text-slate-500 font-medium border border-white/5 italic">
                    Note: {resolutionData.freeze_notes}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Deep Metadata Grid */}
            <div className="grid grid-cols-2 gap-5">
              <div className="aura-glass p-5 rounded-2xl border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={13} className="text-earth-clay" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Membership</p>
                </div>
                <p className="text-sm font-black text-ivory">{resolutionData.planName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Calendar size={10} className="text-slate-600" />
                  <p className="text-[10px] font-bold text-slate-500">Ends {new Date(resolutionData.validUntil).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="aura-glass p-5 rounded-2xl border-white/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={13} className="text-earth-clay" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Financial Status</p>
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee size={12} className="text-emerald-400" />
                  <p className="text-sm font-black text-emerald-400">{resolutionData.lastAmount || '0.00'}</p>
                </div>
                <p className="text-[10px] font-bold text-slate-600 mt-1">Last: {resolutionData.lastPaymentDate ? new Date(resolutionData.lastPaymentDate).toLocaleDateString() : 'None'}</p>
              </div>
            </div>

            {/* 4. Operational Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {resolutionData.blockCode === 'PAYMENT_PENDING' ? (
                <Button
                  variant="primary"
                  onClick={() => { setResolutionData(null); navigate('/payments'); }}
                  icon={CreditCard}
                  className="w-full !bg-orange-600 hover:!bg-orange-700"
                >
                  Confirm Payment
                </Button>
              ) : resolutionData.status === 'FROZEN' ? (
                <Button 
                  variant="primary" 
                  onClick={handleReactivate}
                  loading={isResolving}
                  icon={Sun}
                  className="w-full !bg-amber-600 hover:!bg-amber-700"
                >
                  Reactivate Instantly
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={() => { setResolutionData(null); navigate('/payments'); }}
                  icon={CreditCard}
                  className="w-full"
                >
                  Process Renewal
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => { setResolutionData(null); navigate(`/members/profile/${resolutionData.id}`); }}
                icon={ExternalLink}
                className="w-full"
              >
                Full Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
};

export default Attendance;
