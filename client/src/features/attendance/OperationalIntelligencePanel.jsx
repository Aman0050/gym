import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, Activity, Calendar, CreditCard, 
  TrendingUp, Clock, Shield, IndianRupee,
  History, ArrowRight, Zap, Award, AlertCircle,
  ExternalLink, Sun, Snowflake, RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OperationalIntelligencePanel = ({ data, onReset }) => {
  const navigate = useNavigate();
  const { member, attendance, intelligence } = data;

  const getAlertStyle = (type) => {
    switch (type) {
      case 'EXPIRY': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'VIP':    return 'bg-purple-500/10 border-purple-500/20 text-purple-500';
      case 'NEW':    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      default:       return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="aura-glass p-8 lg:p-10 border-emerald-500/20 bg-emerald-500/[0.02] shadow-2xl relative overflow-hidden"
    >
      {/* ── Background Ambiance ── */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-earth-clay/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Header: Identity & Status ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/[0.05]">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/[0.04] border border-white/[0.08] rounded-[1.8rem] flex items-center justify-center text-earth-clay shadow-xl shadow-black/20">
            <User size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h2 className="text-2xl font-black text-ivory tracking-tight">{member.name}</h2>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                {member.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-earth-clay" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{member.plan_name || 'Pro Membership'}</span>
              </div>
              <div className="w-1 h-1 bg-white/10 rounded-full" />
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-earth-clay" />
                <span className="text-[10px] font-bold uppercase tracking-wider">ID: {member.id.substring(0, 8)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className="flex items-center md:justify-end gap-3 mb-1">
            <Zap size={14} className="text-emerald-400" />
            <p className="text-2xl font-black text-ivory tabular-nums tracking-tight">
              {new Date(attendance.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Verified Check-In</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left Column: Operational Insights ── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Intelligence Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Visits (Month)', value: intelligence.monthlyVisits, icon: TrendingUp, color: 'text-blue-400' },
              { label: 'Streak', value: `${intelligence.streak} Days`, icon: Zap, color: 'text-amber-400' },
              { label: 'Days Left', value: Math.max(0, Math.ceil((new Date(member.valid_until) - new Date()) / (1000*60*60*24))), icon: Calendar, color: 'text-emerald-400' },
              { label: 'Last Visit', value: intelligence.prevVisit ? new Date(intelligence.prevVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A', icon: Clock, color: 'text-slate-400' },
            ].map((stat, i) => (
              <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={12} className="text-earth-clay" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</span>
                </div>
                <p className={`text-sm font-black ${stat.color} tracking-tight`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Smart Alerts */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Operational Intelligence</h4>
            {intelligence.alerts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {intelligence.alerts.map((alert, i) => (
                  <div key={i} className={`p-4 rounded-2xl border flex items-center gap-4 ${getAlertStyle(alert.type)}`}>
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{alert.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl flex items-center gap-4 text-slate-600">
                <Award size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider">Member is in good operational standing</span>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div>
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Express Resolution</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Full Profile', icon: ExternalLink, action: () => navigate(`/members/profile/${member.id}`), variant: 'secondary' },
                { label: 'Renew Plan', icon: Zap, action: () => navigate('/payments'), variant: 'primary' },
                { label: 'Freeze', icon: Snowflake, action: () => {}, variant: 'secondary' },
                { label: 'New Checkin', icon: RotateCcw, action: onReset, variant: 'secondary' },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className={`
                    flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all group
                    ${btn.variant === 'primary' 
                      ? 'bg-earth-clay text-white shadow-lg shadow-earth-clay/20 hover:scale-105 active:scale-95' 
                      : 'bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-ivory hover:bg-white/[0.08]'
                    }
                  `}
                >
                  <btn.icon size={16} className={btn.variant === 'primary' ? 'text-white' : 'text-earth-clay group-hover:scale-110 transition-transform'} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Financial & History ── */}
        <div className="space-y-8">
          
          {/* Financial Snapshot */}
          <div className="aura-glass p-6 bg-earth-clay/[0.03] border-earth-clay/10">
            <h4 className="text-[9px] font-black text-earth-clay uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <CreditCard size={12} />
              Financial Snapshot
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Renewal Date</span>
                <span className="text-xs font-black text-ivory">{new Date(member.valid_until).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plan Amount</span>
                <div className="flex items-center gap-1">
                  <IndianRupee size={10} className="text-emerald-400" />
                  <span className="text-xs font-black text-emerald-400">{member.plan_price || '0.00'}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/[0.05]">
                <div className="flex justify-between items-center text-amber-500">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pending Dues</span>
                  <div className="flex items-center gap-1">
                    <IndianRupee size={10} />
                    <span className="text-sm font-black tracking-tight">0.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini History Preview */}
          <div>
            <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <History size={12} />
              Recent Activity
            </h4>
            <div className="space-y-3">
              {intelligence.history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl group hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(h.check_in_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-ivory tabular-nums">
                    {new Date(h.check_in_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default OperationalIntelligencePanel;
