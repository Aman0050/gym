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
  const isCheckingIn = React.useRef(false);
  
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
    if (loading || isCheckingIn.current || !memberId) return;

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(memberId);
    const normalizedPhone = memberId.toString().replace(/\D/g, '');

    if (!isUuid && normalizedPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.", { id: 'phone-validation' });
      return;
    }
    
    isCheckingIn.current = true;
    setLoading(true);
    setManualId(''); // Clear immediately to prevent double scan of same string
    
    try {
      const res = await api.post('/attendance/check-in', { memberId: isUuid ? memberId : normalizedPhone });
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      setLastCheckin(res.data);
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
      // Give a tiny delay before allowing the next scan to prevent hardware scanner bounce
      setTimeout(() => { isCheckingIn.current = false; }, 800);
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
    <PageTransition className="flex flex-col lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 min-h-0 pt-2 lg:pt-4 pb-4">

        {/* ── Page Header ── */}
        <FadeIn direction="down" duration={0.4}>
          <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center gap-6 mb-2">
              <div className="w-12 h-px bg-earth-clay/30" />
              <span className="label-text text-earth-clay tracking-[0.2em] font-black uppercase text-xs">Ready for member verification</span>
              <div className="w-12 h-px bg-earth-clay/30" />
            </div>
            <h1 className="page-title text-ivory">
              Reception <span className="text-earth-clay italic">Console</span>
            </h1>
            <p className="body-text opacity-65 max-w-[36rem] mx-auto text-base leading-relaxed">
              Verify member credentials, monitor check-in status, and manage access logs in real time.
            </p>
          </div>
        </FadeIn>

        {/* ── Symmetrical 2-Column Split Console Grid ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-stretch pb-6">
          
          {/* LEFT SIDE: manual attendance entry card */}
          <div className="flex flex-col min-h-0">
            <Card variant="flat" className="p-6 lg:p-8 flex flex-col">
              <div>
                <h2 className="text-2xl font-black text-ivory flex items-center gap-3 mb-8">
                  <Search className="text-earth-clay" size={24} />
                  Manual Check-In
                </h2>

                <div className="space-y-6">
                  <Input
                    ref={inputRef}
                    label="Member ID or Mobile Number"
                    labelClassName="!text-xs sm:!text-sm tracking-[0.2em]"
                    placeholder="Enter member ID or mobile number..."
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    icon={ShieldCheck}
                    className="!text-xl !py-5 !rounded-2xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualId && !loading) handleCheckin(manualId);
                    }}
                  />
                  <Button
                    onClick={() => handleCheckin(manualId)}
                    disabled={loading || !manualId.trim()}
                    loading={loading}
                    className="w-full h-16 !text-lg !font-black !rounded-2xl shadow-xl shadow-earth-clay/10"
                    icon={UserCheck}
                  >
                    {loading ? 'Verifying Member...' : 'Verify & Check In'}
                  </Button>
                </div>
              </div>

              {/* Enterprise Status indicators */}
              <div className="pt-6 border-t border-white/[0.05] mt-10 flex items-center justify-around text-xs font-black uppercase tracking-widest text-slate-400">
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
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="text-emerald-400">Console Active</span>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT SIDE: Persistent live verification console */}
          <div className="flex flex-col h-full min-h-[400px] lg:min-h-0">
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
                    <div className="flex items-center gap-3.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.25em]">
                        Live Verification Console
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={lastCheckin.member?.status || lastCheckin.attendance?.status || 'ACTIVE'} className="!text-xs" />
                    </div>
                  </div>

                  {/* Center Profile Hub */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="relative w-28 h-28 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-earth-clay shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-30 pointer-events-none" />
                      <User size={44} className="text-earth-clay" />
                      <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-25" />
                    </div>

                    {/* Member Name */}
                    <h3 className="text-3xl lg:text-4xl font-black text-ivory tracking-tight leading-none text-center mt-5 mb-2.5">
                      {lastCheckin.member?.name || lastCheckin.attendance?.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
                      Member ID: {(lastCheckin.member?.id || lastCheckin.attendance?.member_id || lastCheckin.attendance?.id || '1000').substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Metadata Rows */}
                  <div className="space-y-4 mb-6">
                    
                    {/* Row 1: Plan Details */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center text-earth-clay shadow-inner flex-shrink-0">
                          <Award size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Membership Plan</p>
                          <h4 className="text-base font-black text-ivory tracking-tight">
                            {lastCheckin.member?.plan_name || lastCheckin.attendance?.plan_name || lastCheckin.member?.planName || 'Gym Membership'}
                          </h4>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        {lastCheckin.member?.plan_duration || lastCheckin.attendance?.plan_duration || 'Active Plan'}
                      </span>
                    </div>

                    {/* Row 2: Validity */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center text-earth-clay shadow-inner flex-shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Membership Validity</p>
                          <div className="flex items-center gap-1.5 text-sm font-black text-ivory">
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
                        <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center text-earth-clay shadow-inner flex-shrink-0">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Check-in Timestamp</p>
                          <h4 className="text-base font-black text-emerald-400 tracking-tight">
                            {lastCheckin.attendance?.check_in_time 
                              ? new Date(lastCheckin.attendance.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            }
                          </h4>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Verified
                      </span>
                    </div>

                  </div>

                  {/* Bottom Meta Status Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/[0.05] text-xs font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-earth-clay" />
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
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-emerald-400 tracking-[0.25em] uppercase">
                        Live Verification Console
                      </span>
                    </div>
                    <span className="text-[10px] bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full font-black text-slate-400 uppercase tracking-widest">
                      Ready
                    </span>
                  </div>

                  {/* Center Radar Icon */}
                  <div className="w-full flex flex-col items-center justify-center my-auto space-y-6">
                    <div className="relative w-32 h-32 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-500 relative overflow-hidden shadow-2xl">
                      <Activity size={44} className="text-earth-clay animate-pulse" />
                      <div className="absolute inset-0 rounded-full border border-earth-clay/20 animate-ping opacity-15" />
                    </div>
                    
                    <div className="w-full space-y-2">
                      <h4 className="text-2xl font-black text-ivory tracking-tight">
                        Reception Console Ready
                      </h4>
                      <p className="text-sm text-slate-400 font-semibold max-w-[24rem] leading-relaxed mx-auto">
                        Enter a member ID or mobile number to begin attendance verification.
                      </p>
                    </div>

                    <span className="text-xs bg-earth-clay/10 border border-earth-clay/20 text-earth-clay px-3 py-1.5 rounded-full font-black uppercase tracking-widest">
                      Awaiting Member Verification
                    </span>
                  </div>

                  {/* Footer status indicator */}
                  <div className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 pt-4 border-t border-white/[0.05]">
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
        maxWidth="max-w-4xl"
      >
        {resolutionData && (
          <div className="space-y-8">
            {/* 1. Member Profile Preview */}
            <div className="flex items-center gap-6 p-7 bg-white/[0.03] border border-white/[0.06] rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-28 h-28 bg-white/[0.05] border border-white/[0.08] rounded-[2rem] flex items-center justify-center text-earth-clay shadow-xl flex-shrink-0">
                <User size={44} />
              </div>
              <div className="flex-1">
                <h4 className="text-3xl font-black text-ivory tracking-tight">{resolutionData.name}</h4>
                <div className="flex items-center gap-2 mt-2 opacity-65">
                  <ShieldCheck size={14} className="text-earth-clay" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">ID: {resolutionData.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="mt-3">
                  <StatusBadge status={resolutionData.status} className="!text-xs" />
                </div>
              </div>
            </div>

            {/* 2. Intelligent Messaging */}
            <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-6 shadow-inner">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                resolutionData.blockCode === 'PAYMENT_PENDING'
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                {resolutionData.blockCode === 'PAYMENT_PENDING'
                  ? <CreditCard size={28} />
                  : <Snowflake size={28} />}
              </div>
              <div>
                <p className={`text-sm font-black uppercase tracking-widest mb-2.5 ${
                  resolutionData.blockCode === 'PAYMENT_PENDING' ? 'text-orange-400' : 'text-amber-500'
                }`}>Action Required</p>
                <p className="text-lg font-bold text-slate-200 leading-relaxed">
                  {typeof resolutionData.error === 'string'
                    ? resolutionData.error
                    : 'Check-in unavailable until membership is reactivated.'}
                </p>
                {resolutionData.freeze_notes && (
                  <p className="mt-3 p-4 bg-black/20 rounded-xl text-sm text-slate-500 font-medium border border-white/5 italic">
                    Note: {resolutionData.freeze_notes}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Deep Metadata Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="aura-glass p-7 rounded-2xl border-white/[0.04]">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <Activity size={18} className="text-earth-clay" />
                  <p className="text-sm font-black uppercase tracking-widest text-slate-500">Membership</p>
                </div>
                <p className="text-lg font-black text-ivory">{resolutionData.planName}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-600" />
                  <p className="text-sm font-bold text-slate-500">Ends {new Date(resolutionData.validUntil).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="aura-glass p-7 rounded-2xl border-white/[0.04]">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <CreditCard size={18} className="text-earth-clay" />
                  <p className="text-sm font-black uppercase tracking-widest text-slate-500">Financial Status</p>
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee size={18} className="text-emerald-400" />
                  <p className="text-lg font-black text-emerald-400">{resolutionData.lastAmount || '0.00'}</p>
                </div>
                <p className="text-sm font-bold text-slate-600 mt-1">Last: {resolutionData.lastPaymentDate ? new Date(resolutionData.lastPaymentDate).toLocaleDateString() : 'None'}</p>
              </div>
            </div>

            {/* 4. Operational Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              {resolutionData.blockCode === 'PAYMENT_PENDING' ? (
                <Button
                  variant="primary"
                  onClick={() => { setResolutionData(null); navigate('/payments'); }}
                  icon={CreditCard}
                  className="w-full !bg-orange-600 hover:!bg-orange-700 !text-sm !py-4 !h-14 !rounded-2xl"
                >
                  Confirm Payment
                </Button>
              ) : resolutionData.status === 'FROZEN' ? (
                <Button 
                  variant="primary" 
                  onClick={handleReactivate}
                  loading={isResolving}
                  icon={Sun}
                  className="w-full !bg-amber-600 hover:!bg-amber-700 !text-sm !py-4 !h-14 !rounded-2xl"
                >
                  Reactivate Instantly
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={() => { setResolutionData(null); navigate('/payments'); }}
                  icon={CreditCard}
                  className="w-full !text-sm !py-4 !h-14 !rounded-2xl"
                >
                  Process Renewal
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => { setResolutionData(null); navigate(`/members/profile/${resolutionData.id}`); }}
                icon={ExternalLink}
                className="w-full !text-sm !py-4 !h-14 !rounded-2xl"
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
