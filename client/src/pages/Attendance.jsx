import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../services/api';
import toast from 'react-hot-toast';
import { QrCode, UserCheck, Search, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import { FadeIn, PageTransition, SuccessCheck } from '../components/Animations';

const Attendance = () => {
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastCheckin, setLastCheckin] = useState(null);

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

  const handleCheckin = async (memberId) => {
    if (loading || !memberId) return;
    setLoading(true);
    try {
      const res = await api.post('/attendance/check-in', { memberId });
      toast.success(res.data.message || 'Check-in successful', { duration: 4000 });
      setLastCheckin(res.data.attendance);
      setManualId('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Check-in failed. Please try again.';
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8 pb-safe-area">

        {/* ── Page Header ── */}
        <FadeIn direction="down" duration={0.4}>
          <div className="text-center space-y-5">
            <div className="flex items-center justify-center gap-6 mb-2">
              <div className="w-12 h-px bg-earth-clay/30" />
              <span className="label-text">Check-In Station</span>
              <div className="w-12 h-px bg-earth-clay/30" />
            </div>
            <h1 className="page-title text-ivory">
              Member{' '}
              <span className="text-earth-clay italic">Check-In</span>
            </h1>
            <p className="body-text max-w-md mx-auto opacity-60">
              Scan a member's QR code or enter their ID manually to record attendance.
            </p>
          </div>
        </FadeIn>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* QR Scanner */}
          <FadeIn direction="left" duration={0.45}>
            <Card variant="flat" className="p-8 lg:p-10 h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-ivory flex items-center gap-3">
                  <QrCode className="text-earth-clay" size={22} />
                  QR Scanner
                </h2>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <span className="status-dot-success w-1.5 h-1.5" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
                </div>
              </div>

              <div
                id="reader"
                className="overflow-hidden rounded-3xl border border-white/[0.07] bg-black/50 shadow-inner"
              />

              <p className="mt-6 text-[10px] text-slate-600 font-semibold text-center uppercase tracking-widest">
                Align QR code within the scanning frame
              </p>
            </Card>
          </FadeIn>

          {/* Manual Entry + Success State */}
          <FadeIn direction="right" duration={0.45}>
            <div className="space-y-6 h-full flex flex-col">

              {/* Manual Entry Card */}
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

              {/* Success State */}
              {lastCheckin && (
                <FadeIn direction="up" duration={0.35}>
                  <div className="aura-glass p-7 flex items-center gap-6 border border-emerald-500/15 bg-emerald-500/[0.03] shadow-lg shadow-emerald-500/5">
                    <SuccessCheck size="sm" />
                    <div>
                      <p className="label-text !text-emerald-400 mb-1.5">Check-In Successful</p>
                      <p className="text-lg font-black text-ivory tracking-tight">
                        {new Date(lastCheckin.check_in_time).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                      <div className="flex items-center gap-2 mt-2 opacity-60">
                        <Activity size={11} className="text-earth-clay" />
                        <p className="text-[10px] text-slate-400 font-medium">Attendance recorded</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Security Footer */}
              <div className="mt-auto flex items-center justify-center gap-3 opacity-25">
                <ShieldCheck size={13} className="text-earth-clay" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Secure Attendance Station
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
};

export default Attendance;
