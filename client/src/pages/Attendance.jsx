import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  QrCode, UserCheck, Search, ShieldCheck, Activity, 
  CheckCircle2, Snowflake, User, Sun, CreditCard, 
  IndianRupee, Calendar, ExternalLink 
} from 'lucide-react';
import { Card, Button, Input, Modal, StatusBadge } from '../components/ui';
import { FadeIn, PageTransition, SuccessCheck } from '../components/Animations';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import OperationalIntelligencePanel from '../features/attendance/OperationalIntelligencePanel';

const Attendance = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastCheckin, setLastCheckin] = useState(null);
  
  // Resolution Modal State
  const [resolutionData, setResolutionData] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isStationMode, setIsStationMode] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 260, height: 260 },
      rememberLastUsedCamera: true,
    });

    scanner.render(
      (decodedText) => {
        handleCheckin(decodedText);
        scanner.clear();
      },
      () => {
        // Passive scan error — ignore
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  const inputRef = React.useRef(null);

  useEffect(() => {
    // Keep focus on input for fast manual entries/barcode scans
    const timer = setInterval(() => {
      if (inputRef.current && !loading && !resolutionData && !lastCheckin) {
        inputRef.current.focus();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, resolutionData, lastCheckin]);

  const handleCheckin = async (memberId) => {
    if (loading || !memberId) return;
    setLoading(true);
    setLastCheckin(null); 
    try {
      const res = await api.post('/attendance/check-in', { memberId });
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      toast.success(res.data.message || 'Check-in successful', { duration: 4000 });
      setLastCheckin(res.data);
      setManualId('');
      setResolutionData(null);

      // Auto-Reset for hands-free flow
      setTimeout(() => {
        setLastCheckin(prev => prev?.attendance?.id === res.data.attendance.id ? null : prev);
      }, 4000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.isBlocked && data.memberData) {
        setResolutionData({ ...data.memberData, error: data.error });
      } else {
        const errorMsg = data?.error || 'Check-in failed. Please try again.';
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
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-8 pb-safe-area">

        {/* ── Page Header ── */}
        {!isStationMode && (
          <FadeIn direction="down" duration={0.4}>
            <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
              <div className="flex items-center justify-center gap-6 mb-2">
                <div className="w-12 h-px bg-earth-clay/30" />
                <span className="label-text">Check-In Station</span>
                <div className="w-12 h-px bg-earth-clay/30" />
              </div>
              <h1 className="page-title text-ivory">
                Member <span className="text-earth-clay italic">Check-In</span>
              </h1>
              <p className="body-text opacity-60 max-w-lg mx-auto">
                Scan a member's QR code or enter their ID manually to record attendance.
              </p>
            </div>
          </FadeIn>
        )}

        {/* ── Station Mode Toggle (Mobile Only) ── */}
        <div className="lg:hidden flex items-center justify-center">
          <button
            onClick={() => setIsStationMode(!isStationMode)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all
              ${isStationMode 
                ? 'bg-earth-clay border-earth-clay text-white shadow-lg' 
                : 'bg-white/[0.04] border-white/[0.08] text-slate-500'
              }
            `}
          >
            <Activity size={14} className={isStationMode ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isStationMode ? 'Exit Station Mode' : 'Enter Station Mode'}
            </span>
          </button>
        </div>

        {/* ── Intelligence Hub: Conditional View ── */}
        <AnimatePresence mode="wait">
          {lastCheckin ? (
            <FadeIn key="intelligence" direction="up" duration={0.5}>
              <OperationalIntelligencePanel 
                data={lastCheckin} 
                onReset={() => setLastCheckin(null)} 
              />
            </FadeIn>
          ) : (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`grid grid-cols-1 ${isStationMode ? 'lg:grid-cols-1 max-w-2xl mx-auto' : 'lg:grid-cols-2'} gap-8`}
            >
              {/* QR Scanner */}
              <Card variant="flat" className={`p-8 lg:p-10 h-full ${isStationMode ? 'shadow-earth-clay/10 border-earth-clay/20' : ''}`}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-ivory flex items-center gap-3">
                    <QrCode className="text-earth-clay" size={22} />
                    {isStationMode ? 'Station Active' : 'QR Scanner'}
                  </h2>
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <span className="status-dot-success w-1.5 h-1.5 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Scanning</span>
                  </div>
                </div>

                <div
                  id="reader"
                  className={`overflow-hidden rounded-3xl border border-white/[0.07] bg-black/50 shadow-inner transition-all duration-500 ${isStationMode ? 'aspect-square lg:aspect-video' : ''}`}
                />

                <p className="mt-6 text-[10px] text-slate-600 font-semibold text-center uppercase tracking-widest">
                  {isStationMode ? 'Ready for next member' : 'Align QR code within the scanning frame'}
                </p>
              </Card>

              {/* Manual Entry (Hidden in Station Mode on Mobile) */}
              {(!isStationMode || window.innerWidth >= 1024) && (
                <div className="space-y-6 h-full flex flex-col">
                  <Card variant="flat" className="p-8 lg:p-10">
                    <h2 className="text-xl font-black text-ivory flex items-center gap-3 mb-8">
                      <Search className="text-earth-clay" size={22} />
                      Manual Entry
                    </h2>

                    <div className="space-y-5">
                      <Input
                        label="Member ID"
                        placeholder="Enter member ID..."
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
                        className="w-full"
                        icon={UserCheck}
                      >
                        {loading ? 'Checking In...' : 'Check In Member'}
                      </Button>
                    </div>
                  </Card>

                  <div className="mt-auto flex items-center justify-center gap-3 opacity-25">
                    <ShieldCheck size={13} className="text-earth-clay" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Secure Attendance Station
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 flex-shrink-0 mt-1">
                <Snowflake size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-1.5">Action Required</p>
                <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                  {resolutionData.error || "Check-in unavailable until membership is reactivated."}
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
              {resolutionData.status === 'FROZEN' ? (
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
                  onClick={() => navigate('/payments')}
                  icon={CreditCard}
                  className="w-full"
                >
                  Process Renewal
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => navigate(`/members/profile/${resolutionData.id}`)}
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
