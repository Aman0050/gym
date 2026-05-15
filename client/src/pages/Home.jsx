import { motion } from 'framer-motion';
import { Dumbbell, ArrowRight, Play, CheckCircle2, Menu, X, Zap, Crown, Gem, ShieldCheck, Activity, Globe, Shield, Users, IndianRupee, Cpu, Target } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import loginHero from '../assets/login_hero.jpg';
import membershipBg from '../assets/membership_bg.png';
import { Card, Button } from '../components/ui';
import { FadeIn, HoverCard, PageTransition } from '../components/Animations';

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const navLinks = [
    { name: 'Performance', href: '#performance' },
    { name: 'Membership', href: '#membership' },
  ];

  const billingOptions = [
    { id: 'monthly', label: 'Monthly', price: 2499, period: '/mo', savings: null },
    { id: 'quarterly', label: 'Quarterly', price: 6749, period: 'Total', savings: '10% Savings' },
    { id: 'half-yearly', label: 'Half Yearly', price: 11999, period: 'Total', savings: '20% Savings' },
    { id: 'yearly', label: 'Yearly', price: 20999, period: 'Total', savings: '30% Savings' }
  ];

  const features = [
    "Multi-Branch Management",
    "Real-Time Revenue Dashboard",
    "Smart Billing & Invoices",
    "AI-Powered Analytics",
    "Trainer & Staff Management",
    "Attendance Tracking",
    "Unlimited Members",
    "Payment Ledger System",
    "Recovery & Performance Insights",
    "Dedicated Premium Support"
  ];

  return (
    <PageTransition>
      <div className="bg-obsidian relative selection:bg-earth-clay/20 min-h-screen">
        {/* Hero Section */}
        <section className="h-screen relative overflow-hidden flex flex-col">
          {/* Cinematic Hero Background */}
          <div className="absolute inset-0 z-0">
            <motion.img 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              src={loginHero} 
              className="w-full h-full object-cover"
              alt="FitVibe Wellness"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/60 to-obsidian" />
            <div className="absolute inset-0 bg-earth-clay/5 mix-blend-overlay" />
          </div>

          {/* Floating HUD Decor */}
          <div className="absolute inset-0 z-5 pointer-events-none opacity-20">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] border border-earth-clay/20 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-20%] left-[-10%] w-[1000px] h-[1000px] border border-white/10 rounded-full"
            />
          </div>

          {/* Ultra-Premium Navbar */}
          <nav className="relative z-50 px-8 py-10 lg:px-20">
            <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-5"
              >
                <div className="w-14 h-14 bg-earth-clay rounded-2xl flex items-center justify-center shadow-2xl shadow-earth-clay/30 relative overflow-hidden group">
                  <div className="absolute inset-0 satin-shimmer opacity-30" />
                  <Dumbbell className="text-white relative z-10" size={28} />
                </div>
                <h1 className="text-4xl font-serif font-black text-white tracking-tighter">
                  FIT<span className="text-earth-clay italic satin-shimmer inline-block">VIBE</span>
                </h1>
              </motion.div>

              <div className="hidden lg:flex items-center space-x-16">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="label-text !text-white/50 hover:!text-earth-clay transition-colors"
                  >
                    {link.name}
                  </motion.a>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex items-center space-x-10"
              >
                <Link to="/login" className="label-text !text-white hover:!text-earth-clay transition-colors">
                  Client Portal
                </Link>
                <Link to="/login">
                  <Button variant="primary" className="shadow-2xl">
                    Get Started
                  </Button>
                </Link>
              </motion.div>

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-white">
                {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
          </nav>

          {/* Hero Content */}
          <main className="relative z-10 px-8 lg:px-20 flex-1 flex items-center py-20">
            <div className="max-w-screen-2xl mx-auto w-full grid lg:grid-cols-2 gap-40 items-center">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center space-x-6 mb-12">
                  <div className="w-16 h-[1px] bg-earth-clay shadow-[0_0_10px_rgba(160,82,45,1)]" />
                  <span className="label-text !text-earth-clay">Luxury Performance Intelligence</span>
                </div>
                
                <h2 className="display-title text-white mb-12">
                  Elevate Your <br /> 
                  <span className="text-earth-clay italic satin-shimmer inline-block">Potential.</span>
                </h2>

                <p className="body-text !text-xl max-w-xl italic opacity-60 border-l border-white/10 pl-10 mb-16">
                  "Experience the convergence of performance analytics and luxury fitness. Your journey to total physical integration begins here."
                </p>

                <div className="flex flex-col sm:flex-row items-center space-y-8 sm:space-y-0 sm:space-x-10">
                  <Link to="/login" className="w-full sm:w-auto">
                    <Button variant="primary" className="w-full sm:w-auto py-8 px-16 !text-xs shadow-[0_30px_60_rgba(160,82,45,0.4)]">
                      Start Trial Access
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 2 }}
                className="hidden lg:block relative max-w-2xl ml-auto"
              >
                <div className="absolute inset-0 bg-earth-clay/15 blur-[150px] rounded-full" />
                <Card className="p-20 aura-glass-heavy shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center justify-between mb-16">
                    <div className="flex items-center space-x-6">
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                        <CheckCircle2 className="text-emerald-400" size={28} />
                      </div>
                      <div>
                        <p className="label-text !text-ivory">Live Insights</p>
                        <p className="body-text !text-[11px] opacity-60">Synchronization Active</p>
                      </div>
                    </div>
                    <div className="px-5 py-2 bg-earth-clay/10 rounded-full border border-earth-clay/20 shadow-lg">
                      <span className="text-earth-clay text-[9px] font-black tracking-widest">ENCRYPTED</span>
                    </div>
                  </div>
                  
                  <div className="space-y-12">
                    {[
                      { label: 'Performance Coherence', val: 94 },
                      { label: 'Metabolic Velocity', val: 82 },
                      { label: 'Recovery Index', val: 89 }
                    ].map((metric, i) => (
                      <div key={i} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="label-text !text-ivory !text-[10px]">{metric.label}</span>
                          <span className="text-earth-clay font-black text-xs">{metric.val}%</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.val}%` }}
                            transition={{ delay: 1.5 + i * 0.2, duration: 2, ease: "easeOut" }}
                            className="h-full bg-earth-clay shadow-[0_0_20px_rgba(160,82,45,1)]" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </main>

          <div className="absolute bottom-12 left-12 lg:left-20 flex space-x-12 opacity-30">
            <span className="label-text !text-slate-500 !text-[9px]">FitVibe Enterprise v5.0.2</span>
            <span className="label-text !text-slate-500 !text-[9px]">All Rights Reserved</span>
          </div>
        </section>

        {/* Intelligence Section */}
        <section id="performance" className="py-32 lg:py-56 bg-obsidian relative overflow-hidden">
           {/* Subtle background texture */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#a0522d_1px,transparent_1px)] [background-size:40px_40px]" />
           </div>

           <div className="max-w-screen-2xl mx-auto px-8 lg:px-20 relative z-10">
              <div className="text-center mb-24">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center space-x-6 mb-10"
                >
                  <div className="w-16 h-[1px] bg-earth-clay shadow-[0_0_10px_rgba(160,82,45,1)]" />
                  <span className="label-text !text-earth-clay uppercase tracking-[0.4em]">Real-Time Scale</span>
                  <div className="w-16 h-[1px] bg-earth-clay shadow-[0_0_10px_rgba(160,82,45,1)]" />
                </motion.div>
                <h2 className="display-title text-white mb-6">
                  Platform <span className="text-earth-clay italic satin-shimmer inline-block">Intelligence.</span>
                </h2>
                <p className="body-text !text-base lg:!text-lg opacity-60 max-w-2xl mx-auto italic">
                  "Measurable business growth powered by high-fidelity operational analytics and enterprise-grade infrastructure."
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                  {/* Card 1: Platform Adoption */}
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    <Card className="aura-glass-heavy p-12 lg:p-16 border-white/10 h-full relative group overflow-hidden">
                       <div className="absolute top-0 right-0 p-6">
                          <div className="flex items-center space-x-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full shadow-lg">
                             <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Sync Active</span>
                          </div>
                       </div>

                       <div className="mb-16">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-earth-clay mb-10 border border-white/5 shadow-inner">
                            <Globe size={32} />
                          </div>
                          <h3 className="text-3xl font-serif font-black text-white tracking-tighter mb-4">Adoption Velocity</h3>
                          <p className="label-text !text-slate-500 !text-[11px] uppercase tracking-[0.3em]">Global Platform Scale Metrics</p>
                       </div>

                       <div className="grid grid-cols-2 gap-y-12 gap-x-8 mb-16">
                          {[
                            { label: 'Active Gyms', value: '128+', icon: Globe },
                            { label: 'Members Managed', value: '42,000+', icon: Users },
                            { label: 'Monthly Revenue', value: '₹2.4Cr', icon: IndianRupee },
                            { label: 'Active Branches', value: '320+', icon: Activity }
                          ].map((stat, i) => (
                            <div key={i} className="space-y-3">
                               <p className="label-text !text-slate-500 !text-[9px] uppercase tracking-widest">{stat.label}</p>
                               <div className="flex items-center space-x-3">
                                  <stat.icon size={14} className="text-earth-clay/60" />
                                  <span className="text-2xl font-black text-ivory tracking-tighter">{stat.value}</span>
                               </div>
                               <div className="h-1 w-12 bg-earth-clay/20 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '70%' }}
                                    transition={{ delay: 0.5 + i * 0.1, duration: 1.5 }}
                                    className="h-full bg-earth-clay"
                                  />
                               </div>
                            </div>
                          ))}
                       </div>

                       <div className="pt-10 border-t border-white/5">
                          <Button variant="secondary" className="w-full py-6 !text-[10px] group/btn">
                             View Platform Analytics 
                             <ArrowRight size={14} className="ml-3 group-hover/btn:translate-x-2 transition-transform" />
                          </Button>
                       </div>
                    </Card>
                  </motion.div>

                  {/* Card 2: Business Outputs */}
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    <Card className="aura-glass-heavy p-12 lg:p-16 border-white/10 h-full relative group overflow-hidden">
                       <div className="mb-16">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-earth-clay mb-10 border border-white/5 shadow-inner">
                            <Zap size={32} />
                          </div>
                          <h3 className="text-3xl font-serif font-black text-white tracking-tighter mb-4">Operational Impact</h3>
                          <p className="label-text !text-slate-500 !text-[11px] uppercase tracking-[0.3em]">Business Outcome Analytics</p>
                       </div>

                       <div className="space-y-10 mb-16">
                          {[
                            { label: 'Payment Velocity', value: '+34%', desc: 'Faster processing vs legacy systems', trend: 'up' },
                            { label: 'Retention Growth', value: '+27%', desc: 'Increase in member lifetime value', trend: 'up' },
                            { label: 'Admin Efficiency', value: '-41%', desc: 'Reduction in manual workflows', trend: 'down' }
                          ].map((output, i) => (
                            <div key={i} className="flex items-center justify-between group/item">
                               <div className="space-y-1">
                                  <p className="text-ivory text-sm font-bold tracking-tight">{output.label}</p>
                                  <p className="text-[10px] text-slate-500 italic opacity-60">"{output.desc}"</p>
                               </div>
                               <div className="text-right">
                                  <span className={`text-xl font-black ${output.trend === 'up' ? 'text-emerald-400' : 'text-earth-clay'} tracking-tighter`}>
                                    {output.value}
                                  </span>
                                  <div className="h-1 w-16 bg-white/5 rounded-full mt-2 overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       whileInView={{ width: '85%' }}
                                       transition={{ delay: 0.8 + i * 0.1, duration: 2 }}
                                       className={`h-full ${output.trend === 'up' ? 'bg-emerald-400' : 'bg-earth-clay'}`}
                                     />
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>

                       <div className="p-6 bg-earth-clay/5 border border-earth-clay/10 rounded-2xl mb-12 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 opacity-20">
                             <Cpu size={24} className="text-earth-clay" />
                          </div>
                          <p className="text-[9px] font-black text-earth-clay uppercase tracking-[0.2em] mb-4 flex items-center">
                             <Target size={12} className="mr-2" /> AI Intelligence Snippet
                          </p>
                          <p className="text-xs text-ivory/80 italic leading-relaxed">
                            "Retention engagement across premium branches increased by 18% this business cycle."
                          </p>
                       </div>

                       <div className="pt-10 border-t border-white/5 mt-auto">
                          <Button variant="secondary" className="w-full py-6 !text-[10px] group/btn">
                             Explore Performance Insights
                             <ArrowRight size={14} className="ml-3 group-hover/btn:translate-x-2 transition-transform" />
                          </Button>
                       </div>
                    </Card>
                  </motion.div>
              </div>
           </div>
        </section>

        {/* Membership Section */}
        <section id="membership" className="min-h-screen relative overflow-hidden bg-obsidian py-32 lg:py-56 px-8 lg:px-20 flex flex-col items-center">
          <div className="absolute inset-0 z-0">
            <img src={membershipBg} className="w-full h-full object-cover opacity-30 grayscale" alt="" />
            <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/60 to-obsidian" />
          </div>

          <div className="max-w-screen-2xl mx-auto relative z-10 w-full flex flex-col items-center">
            <div className="text-center mb-20 lg:mb-24">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center space-x-6 mb-10"
              >
                <div className="w-16 h-[1px] bg-earth-clay shadow-[0_0_10px_rgba(160,82,45,1)]" />
                <span className="label-text !text-earth-clay uppercase tracking-[0.4em]">Subscription Strategy</span>
                <div className="w-16 h-[1px] bg-earth-clay shadow-[0_0_10px_rgba(160,82,45,1)]" />
              </motion.div>
              <h2 className="display-title text-white mb-10">
                FitVibe <span className="text-earth-clay italic satin-shimmer inline-block">OS.</span>
              </h2>
              
              {/* Ultra-Premium Billing Selector */}
              <div className="flex justify-center mt-12 relative">
                 <div className="aura-glass p-2 rounded-[2.5rem] border-white/5 flex items-center space-x-2 relative shadow-2xl backdrop-blur-3xl">
                    {billingOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setBillingCycle(option.id)}
                        className={`relative px-8 py-4 rounded-[2rem] label-text transition-all duration-500 z-10 whitespace-nowrap ${
                          billingCycle === option.id ? 'text-white font-black' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <span className="relative z-10">{option.label}</span>
                        {billingCycle === option.id && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute inset-0 bg-earth-clay rounded-[2rem] shadow-[0_10px_30px_rgba(160,82,45,0.4)]"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                          />
                        )}
                      </button>
                    ))}
                 </div>
              </div>
            </div>

            {/* Single Premium SaaS Card */}
            <div className="w-full max-w-4xl relative group">
               {/* Animated Background Glow */}
               <div className="absolute inset-0 bg-earth-clay/20 blur-[120px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="absolute -inset-1 bg-gradient-to-b from-earth-clay/20 via-transparent to-transparent rounded-[3rem] opacity-30" />
               
               <motion.div
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1 }}
               >
                 <Card className="relative aura-glass-heavy p-12 lg:p-20 border-white/10 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-earth-clay/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
                    
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 relative z-10">
                       {/* Left side: Plan Identity */}
                       <div className="space-y-12">
                          <div>
                             <div className="w-16 h-16 bg-earth-clay rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-earth-clay/20">
                                <Zap className="text-white" size={32} />
                             </div>
                             <h3 className="text-5xl font-serif font-black text-white tracking-tighter mb-4">FitVibe OS</h3>
                             <p className="label-text !text-earth-clay !text-[11px] uppercase tracking-[0.3em]">Enterprise Gym Management Platform</p>
                          </div>

                          <div className="space-y-6">
                             <div className="flex items-baseline space-x-3">
                                <span className="text-earth-clay text-6xl font-serif italic">₹</span>
                                <motion.span 
                                  key={billingCycle}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-8xl font-black text-white tracking-tighter leading-none"
                                >
                                  {billingOptions.find(o => o.id === billingCycle).price}
                                </motion.span>
                                <span className="label-text !text-slate-500 !text-sm uppercase tracking-widest">
                                  {billingOptions.find(o => o.id === billingCycle).period}
                                </span>
                             </div>
                             
                             {billingOptions.find(o => o.id === billingCycle).savings && (
                               <motion.div 
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 className="inline-flex items-center space-x-3 bg-earth-clay/10 border border-earth-clay/20 px-5 py-2 rounded-full shadow-lg shadow-earth-clay/5"
                               >
                                  <div className="w-1.5 h-1.5 bg-earth-clay rounded-full animate-pulse" />
                                  <span className="text-[10px] font-black text-earth-clay uppercase tracking-widest">
                                    {billingOptions.find(o => o.id === billingCycle).savings} Included
                                  </span>
                               </motion.div>
                             )}
                          </div>

                          <div className="flex flex-col space-y-5 pt-8">
                             <Button variant="primary" className="py-8 px-12 !text-xs shadow-[0_30px_60px_rgba(160,82,45,0.4)]">
                                Start Free Trial
                             </Button>
                             <Button variant="secondary" className="py-8 px-12 !text-xs border-white/10 hover:border-earth-clay/30 transition-all">
                                Book Demo
                             </Button>
                          </div>
                       </div>

                       {/* Right side: Enterprise Features */}
                       <div className="space-y-10 lg:pl-16 lg:border-l border-white/5">
                          <p className="label-text !text-slate-500 !text-[10px] uppercase tracking-[0.4em] mb-12">Core Capabilities</p>
                          <div className="space-y-6">
                             {features.map((feature, i) => (
                               <motion.div 
                                 key={feature} 
                                 initial={{ opacity: 0, x: 20 }}
                                 whileInView={{ opacity: 1, x: 0 }}
                                 transition={{ delay: i * 0.05 }}
                                 className="flex items-center space-x-6 group/item"
                               >
                                  <div className="w-2 h-2 bg-earth-clay rounded-full shadow-[0_0_12px_rgba(160,82,45,1)] group-hover/item:scale-150 transition-transform duration-500" />
                                  <span className="body-text !text-[13px] !text-slate-300 group-hover/item:text-ivory transition-colors italic">{feature}</span>
                               </motion.div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </Card>
               </motion.div>
            </div>

            <div className="mt-32 text-center opacity-40 flex flex-col items-center">
               <div className="w-16 h-[1px] bg-white/20 mb-10" />
               <p className="label-text !text-slate-400 !text-[10px] uppercase tracking-[0.6em]">Trusted by Modern Fitness Brands</p>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Home;
