import React from 'react';
import { ShieldAlert, LogOut, MessageSquare, Clock, Building2 } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { FadeIn, PageTransition } from '../components/Animations';
import useAuthStore from '../store/authStore';

const SuspensionScreen = ({ reason, timestamp }) => {
  const { logout, user } = useAuthStore();

  const handleSupport = () => {
    window.location.href = 'mailto:support@fitvibe.com?subject=Gym Suspension Inquiry';
  };

  return (
    <PageTransition>
      <div className="fixed inset-0 z-[9999] bg-obsidian/95 backdrop-blur-2xl flex items-center justify-center p-6">
        <div className="wellness-aura" />
        
        <FadeIn direction="up" duration={0.6}>
          <Card variant="flat" className="max-w-2xl w-full p-8 lg:p-12 border-earth-clay/20 bg-white/[0.02] shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-earth-clay/10 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Alert Icon */}
              <div className="relative">
                <div className="w-24 h-24 bg-earth-clay/10 border border-earth-clay/20 rounded-3xl flex items-center justify-center text-earth-clay shadow-inner animate-pulse">
                  <ShieldAlert size={48} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-obsidian border border-earth-clay/30 rounded-full flex items-center justify-center">
                  <Clock size={14} className="text-earth-clay" />
                </div>
              </div>

              {/* Message Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <div className="w-8 h-px bg-earth-clay/30" />
                  <span className="label-text">Security Lockout</span>
                  <div className="w-8 h-px bg-earth-clay/30" />
                </div>
                <h1 className="text-4xl font-black text-ivory tracking-tight">
                  Account <span className="text-earth-clay italic">Suspended</span>
                </h1>
                <p className="body-text max-w-md mx-auto opacity-70">
                  Access to <span className="text-ivory font-bold">{user?.gym_name || 'your gym'}</span> has been temporarily restricted by the FitVibe platform administration.
                </p>
              </div>

              {/* Suspension Intel Card */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="aura-glass p-5 text-left space-y-3 bg-white/[0.01]">
                  <div className="flex items-center gap-2 text-earth-clay opacity-60">
                    <MessageSquare size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Lockout Reason</span>
                  </div>
                  <p className="text-sm font-bold text-ivory/90 italic leading-relaxed">
                    "{reason || 'Compliance or billing review in progress.'}"
                  </p>
                </div>
                
                <div className="aura-glass p-5 text-left space-y-3 bg-white/[0.01]">
                  <div className="flex items-center gap-2 text-earth-clay opacity-60">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Enforcement Date</span>
                  </div>
                  <p className="text-sm font-black text-ivory tracking-tight">
                    {timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Hub */}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button 
                  variant="secondary" 
                  className="flex-1 py-6 text-xs uppercase tracking-widest font-black"
                  icon={MessageSquare}
                  onClick={handleSupport}
                >
                  Contact Support
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 py-6 text-xs uppercase tracking-widest font-black shadow-lg shadow-earth-clay/20"
                  icon={LogOut}
                  onClick={logout}
                >
                  Terminate Session
                </Button>
              </div>

              <div className="flex items-center gap-3 opacity-20">
                <Building2 size={12} className="text-earth-clay" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  FitVibe Enterprise SaaS Security
                </span>
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  );
};

export default SuspensionScreen;
