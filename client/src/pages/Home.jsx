import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ArrowRight, CheckCircle2, Menu, X, Zap, Activity, Globe, Users, IndianRupee, Cpu, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import loginHero from '../assets/login_hero.jpg';
import membershipBg from '../assets/membership_bg.png';
import logo from '../assets/logo-fitxeno.svg';
import lionIcon from '../assets/flaming-lion.png';
import { Card, Button } from '../components/ui';
import { PageTransition } from '../components/Animations';

import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import FreeTrialModal from '../components/modals/FreeTrialModal';
import BookDemoModal from '../components/modals/BookDemoModal';

const Home = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const billingOptions = [
    { id: 'monthly', label: 'Monthly', price: '1,999', period: '/mo', savings: null },
    { id: 'quarterly', label: 'Quarterly', price: '4,999', period: 'total', savings: '16%' },
    { id: 'half-yearly', label: 'Half Yearly', price: '8,999', period: 'total', savings: '25%' },
    { id: 'yearly', label: 'Yearly', price: '14,999', period: 'total', savings: '37%' }
  ];

  const features = [
    "Multi-Branch Management",
    "Real-Time Revenue Dashboard",
    "Smart Billing & Invoices",
    "AI-Powered Analytics",
    "Staff Management",
    "Attendance Tracking",
    "Unlimited Members",
    "Payment Ledger",
    "Recovery Insights",
    "Premium Support"
  ];

  return (
    <PageTransition>
      <div className="bg-obsidian relative selection:bg-earth-clay/20 min-h-screen text-slate-300">
        
        <PublicNavbar />

        {/* ── Hero Section ── */}
        <section className="relative min-h-[90vh] sm:min-h-screen flex flex-col pt-16 lg:pt-0">
          <div className="absolute inset-0 z-0">
            <motion.img 
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 }}
              src={loginHero} 
              className="w-full h-full object-cover"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/80 to-obsidian" />
          </div>

          <main className="relative z-10 px-4 sm:px-6 lg:px-8 flex-1 flex items-center py-24 sm:py-32 lg:py-40">
            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 sm:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                  <div className="w-10 h-px bg-earth-clay" />
                  <span className="label-text !text-earth-clay">Luxury OS</span>
                </div>
                
                <h2 className="display-title text-white mb-6 sm:mb-8">
                  Gym <br className="hidden sm:block" /> 
                  <span className="text-earth-clay italic inline-block">Operations.</span>
                </h2>

                <p className="body-text max-w-lg italic border-l border-white/10 pl-5 mb-8 sm:mb-12">
                  "The enterprise-grade operating system for modern luxury fitness brands."
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
                  <Button onClick={() => setIsTrialOpen(true)} variant="primary" className="w-full sm:w-auto !py-5 !px-12 shadow-xl">
                    Start Trial Access
                  </Button>
                </div>
              </motion.div>

              {/* HUD Element (Desktop Only) */}
              <div className="hidden lg:block relative">
                 <div className="absolute inset-0 bg-earth-clay/10 blur-[120px] rounded-full" />
                 <Card className="aura-glass-heavy p-12 border-white/5 relative z-10">
                    <div className="flex items-center justify-between mb-10">
                       <p className="label-text !text-ivory">Operational Status</p>
                       <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="text-[8px] text-emerald-400 font-black">ACTIVE</span>
                       </div>
                    </div>
                    <div className="space-y-8">
                       {[
                         { label: 'Revenue Efficiency', val: '94%' },
                         { label: 'Member Retention', val: '88%' },
                         { label: 'Branch Capacity', val: '72%' }
                       ].map((m) => (
                         <div key={m.label} className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                               <span>{m.label}</span>
                               <span className="text-earth-clay">{m.val}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: m.val }}
                                 transition={{ delay: 0.8, duration: 1.5 }}
                                 className="h-full bg-earth-clay shadow-glow"
                               />
                            </div>
                         </div>
                       ))}
                    </div>
                 </Card>
              </div>
            </div>
          </main>
        </section>

        {/* ── Intelligence Section ── */}
        <section id="performance" className="py-24 sm:py-32 lg:py-40 relative overflow-hidden bg-gradient-to-b from-obsidian to-obsidian/95">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16 sm:mb-24">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="w-8 h-px bg-earth-clay" />
                  <span className="label-text !text-earth-clay">Scalability</span>
                  <div className="w-8 h-px bg-earth-clay" />
                </div>
                <h2 className="display-title text-white mb-6">
                  Platform <span className="text-earth-clay italic">Analytics.</span>
                </h2>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
                    <Card className="p-6 sm:p-10 lg:p-16 relative group">
                       <div className="flex items-center justify-between mb-10">
                          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-earth-clay border border-white/5">
                            <Globe size={20} />
                          </div>
                          <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                             <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Global Scale</span>
                          </div>
                       </div>
                       <h3 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight mb-8">Adoption Velocity</h3>
                       <div className="grid grid-cols-2 gap-6 sm:gap-10 mb-10">
                          {[
                            { label: 'Gyms', value: '128+', icon: Globe },
                            { label: 'Users', value: '42K+', icon: Users },
                            { label: 'Revenue', value: '₹2.4Cr', icon: IndianRupee },
                            { label: 'Growth', value: '+40%', icon: Activity }
                          ].map((stat) => (
                            <div key={stat.label} className="space-y-2">
                               <p className="label-text !text-slate-500 !text-[8px]">{stat.label}</p>
                               <span className="text-xl sm:text-2xl font-black text-ivory tracking-tight">{stat.value}</span>
                               <div className="h-0.5 w-10 bg-earth-clay/20 rounded-full">
                                  <div className="h-full bg-earth-clay w-[60%]" />
                               </div>
                            </div>
                          ))}
                       </div>
                       <Button variant="secondary" className="w-full !py-4 !text-[9px]">
                          View Insights <ArrowRight size={14} className="ml-2" />
                       </Button>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="p-6 sm:p-10 lg:p-16 relative">
                       <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-earth-clay mb-10 border border-white/5">
                         <Cpu size={20} />
                       </div>
                       <h3 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight mb-8">Operational ROI</h3>
                       <div className="space-y-8 mb-10">
                          {[
                            { label: 'Payment Speed', val: '+34%' },
                            { label: 'Admin Overhead', val: '-41%' },
                            { label: 'Retention Rate', val: '+28%' }
                          ].map((roi) => (
                            <div key={roi.label} className="flex items-center justify-between">
                               <span className="text-[13px] font-medium text-slate-400 italic">{roi.label}</span>
                               <span className={`text-lg font-black ${roi.val.startsWith('+') ? 'text-emerald-400' : 'text-earth-clay'}`}>
                                 {roi.val}
                               </span>
                            </div>
                          ))}
                       </div>
                       <div className="p-4 bg-earth-clay/5 border border-earth-clay/10 rounded-xl">
                          <p className="text-xs text-white font-medium italic leading-relaxed">
                            "System intelligence has identified a 12% revenue leak in member renewals across standard plans."
                          </p>
                       </div>
                    </Card>
                  </motion.div>
              </div>
           </div>
        </section>

        {/* ── Membership Section ── */}
        <section id="membership" className="py-24 sm:py-32 lg:py-40 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={membershipBg} className="w-full h-full object-cover scale-[1.3] origin-right opacity-20 grayscale" alt="" />
            <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-transparent to-obsidian" />
          </div>

          <div className="max-w-4xl mx-auto px-4 relative z-10 w-full">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="display-title text-white mb-8 sm:mb-10">
                The <span className="text-earth-clay italic">Platform.</span>
              </h2>
              
              {/* Compact Toggle */}
              <div className="flex justify-center">
                 <div className="aura-glass p-1 rounded-xl border-white/5 flex items-center space-x-1">
                    {billingOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setBillingCycle(opt.id)}
                        className={`relative px-4 sm:px-6 py-2.5 rounded-lg label-text !text-[8px] sm:!text-[9px] transition-all z-10 ${
                          billingCycle === opt.id ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        <span className="relative z-10">{opt.label}</span>
                        {billingCycle === opt.id && (
                          <motion.div 
                            layoutId="activeTabFinal"
                            className="absolute inset-0 bg-earth-clay rounded-lg shadow-lg"
                            transition={{ type: "spring", duration: 0.5 }}
                          />
                        )}
                      </button>
                    ))}
                 </div>
              </div>
            </div>

            {/* High-Density Pricing Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
               <Card className="p-6 sm:p-12 lg:p-16 border-white/10 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-earth-clay/5 rounded-full -mr-32 -mt-32 blur-[80px]" />
                  
                  <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 relative z-10">
                     <div className="space-y-8">
                        <div>
                           <div className="w-10 h-10 bg-earth-clay rounded-lg flex items-center justify-center mb-6 shadow-xl">
                              <Zap className="text-white" size={20} />
                           </div>
                           <h3 className="text-3xl sm:text-4xl font-serif font-black text-white tracking-tight">FitXeno OS</h3>
                           <p className="label-text !text-earth-clay !text-[9px] mt-2">Enterprise Infrastructure</p>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-baseline space-x-2">
                              <span className="text-earth-clay text-4xl font-serif italic">₹</span>
                              <motion.span 
                                key={billingCycle}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-5xl sm:text-7xl font-black text-white tracking-tight"
                              >
                                {billingOptions.find(o => o.id === billingCycle).price}
                              </motion.span>
                              <span className="label-text !text-slate-500 !text-[10px] uppercase">
                                {billingOptions.find(o => o.id === billingCycle).period}
                              </span>
                           </div>
                           
                           {billingOptions.find(o => o.id === billingCycle).savings && (
                              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                 <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                                   {billingOptions.find(o => o.id === billingCycle).savings} Included
                                 </span>
                              </div>
                           )}
                        </div>

                        <div className="flex flex-col gap-3">
                           <Button onClick={() => setIsTrialOpen(true)} variant="primary" className="w-full !py-4 shadow-xl">Start Trial</Button>
                           <Button onClick={() => setIsDemoOpen(true)} variant="secondary" className="w-full !py-4 border-white/5">Book Demo</Button>
                        </div>
                     </div>

                     <div className="space-y-6 lg:pl-12 lg:border-l border-white/5">
                        <p className="label-text !text-slate-500 !text-[9px] uppercase tracking-[0.4em]">Core Stack</p>
                        <div className="grid grid-cols-1 gap-4">
                           {features.map((f) => (
                             <div key={f} className="flex items-center space-x-4">
                                <CheckCircle2 className="text-earth-clay/40" size={14} />
                                <span className="text-[12px] text-slate-300 font-medium italic">{f}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </Card>
            </motion.div>

            <div className="mt-16 sm:mt-24" />
          </div>
        </section>

        <PublicFooter />

        <FreeTrialModal isOpen={isTrialOpen} onClose={() => setIsTrialOpen(false)} />
        <BookDemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
      </div>
    </PageTransition>
  );
};

export default Home;
