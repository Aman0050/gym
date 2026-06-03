import { motion } from 'framer-motion';
import { 
  Building2, Users, IndianRupee, Activity, Target, 
  ArrowRight, ShieldCheck, Zap, LineChart, Globe, 
  Cpu, Network, Lock, Layers, BarChart3, Fingerprint
} from 'lucide-react';
import { Link } from 'react-router-dom';
import loginHero from '../assets/login_hero.jpg';
import membershipBg from '../assets/membership_bg.png';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { Card, Button } from '../components/ui';
import { PageTransition } from '../components/Animations';

const About = () => {
  const problemsSolved = [
    {
      title: 'Revenue Hemorrhage',
      desc: 'Traditional systems fail to catch expired memberships and failed auto-pays. We plug the leaks with intelligent ledger tracking.',
      icon: IndianRupee,
    },
    {
      title: 'Operational Blindness',
      desc: 'Operating without real-time data is gambling. We provide command-center visibility across all branches simultaneously.',
      icon: LineChart,
    },
    {
      title: 'Fragmented Ecosystems',
      desc: 'Using separate tools for CRM, billing, and access control creates chaos. We unify the entire operational stack.',
      icon: Layers,
    },
    {
      title: 'Growth Bottlenecks',
      desc: 'Spreadsheets cannot scale. Our infrastructure is engineered to support unlimited members and multi-national franchises seamlessly.',
      icon: Network,
    }
  ];

  const infrastructure = [
    { label: 'Uptime Reliability', value: '99.99%', icon: Activity },
    { label: 'Data Encryption', value: 'AES-256', icon: Lock },
    { label: 'Global Edge Network', value: '<50ms', icon: Globe },
    { label: 'Biometric Ready', value: 'Native', icon: Fingerprint },
  ];

  const roadmap = [
    { phase: 'Phase I', title: 'Core Unification', desc: 'Centralizing billing, member data, and access control into a single unified ledger. (Completed)' },
    { phase: 'Phase II', title: 'Predictive Intelligence', desc: 'Deploying machine learning to forecast member churn and optimize pricing strategies. (Active Deployment)' },
    { phase: 'Phase III', title: 'Autonomous Operations', desc: 'Self-resolving support ticketing and autonomous inventory supply chain management. (In Development)' },
  ];

  return (
    <PageTransition>
      <div className="bg-obsidian min-h-screen text-slate-300 selection:bg-earth-clay/20 font-sans relative">
        <PublicNavbar />

        {/* ── CINEMATIC HERO SECTION (5-LAYER SYSTEM) ── */}
        <section className="relative min-h-[60vh] sm:min-h-[70vh] flex flex-col pt-32 lg:pt-40 justify-center pb-20 lg:pb-32 overflow-hidden">
          
          {/* Layer 1: Background Collage (Extreme Suppression) */}
          <div className="absolute inset-0 z-0 pointer-events-none">
             <div className="absolute inset-0 bg-obsidian" />
             <img 
               src={loginHero} 
               className="absolute inset-0 w-full h-full object-cover opacity-[0.04] grayscale blur-[3px] contrast-75 mix-blend-screen"
               alt=""
             />
          </div>

          {/* Layer 2: Deep Dark Gradient Overlay */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-obsidian via-black/80 to-obsidian pointer-events-none" />

          {/* Layer 3: Ambient Radial Glows */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
             <motion.div 
               animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1] }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-earth-clay/40 blur-[200px] rounded-[100%] mix-blend-screen" 
             />
             <div className="absolute bottom-0 right-[-20%] w-[1000px] h-[1000px] bg-emerald-900/10 blur-[150px] rounded-full mix-blend-screen" />
          </div>

          <main className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl mx-auto relative w-full"
            >
              {/* Layer 4: Glassmorphism Content Panel */}
              <div className="relative z-10 p-8 sm:p-12 lg:p-16 aura-glass-heavy bg-black/40 ring-1 ring-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden backdrop-blur-3xl">
                
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                
                {/* Layer 5: Typography (Focal Points) */}
                <div className="relative z-20">
                  <div className="mb-6 flex justify-center">
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: 0.2, duration: 0.6 }}
                       className="inline-flex items-center space-x-2 bg-black/40 border border-white/10 px-4 py-1.5 rounded-full shadow-inner ring-1 ring-white/5"
                     >
                       <div className="w-2 h-2 rounded-full bg-earth-clay animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Enterprise Infrastructure</span>
                     </motion.div>
                  </div>
                  
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tighter leading-[1] drop-shadow-2xl">
                    The <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-earth-clay to-orange-600 italic pr-2">Operating System</span> <br className="hidden sm:block" />
                    For Modern Fitness.
                  </h1>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light tracking-tight"
                  >
                    FitXeno is not another generic gym management tool. It is a <span className="text-white font-medium">high-performance intelligence platform</span> engineered to eliminate operational chaos, arrest revenue leakage, and scale fitness empires with precision.
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </main>
        </section>

        {/* ── OUR VISION ── */}
        <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-32 bg-transparent z-20 -mt-16 sm:-mt-24 pointer-events-none">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center aura-glass-heavy p-8 sm:p-12 lg:p-16 rounded-3xl bg-black/20 backdrop-blur-2xl ring-1 ring-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                 <motion.div 
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                 >
                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tighter leading-[1.1]">
                       Redefining The <br />
                       <span className="text-earth-clay italic">Technology Standard.</span>
                    </h2>
                 </motion.div>
                 
                 <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6 text-base sm:text-lg text-slate-400 font-light leading-relaxed border-l-2 border-earth-clay/30 pl-6 sm:pl-8"
                 >
                    <p>
                       The fitness industry has been historically underserved by technology. Owners are forced to stitch together fragmented software, resulting in disjointed data, frustrated staff, and compromised member experiences.
                    </p>
                    <p>
                       Our vision is <strong className="text-white font-medium">absolute unification</strong>. We are building a singular, intelligent ecosystem that powers everything from predictive revenue analytics to multi-continental branch deployments. We replace guesswork with absolute operational certainty.
                    </p>
                 </motion.div>
              </div>
           </div>
        </section>

        {/* ── THE PROBLEMS WE SOLVE ── */}
        <section className="py-24 sm:py-32 lg:py-40 relative bg-gradient-to-b from-transparent via-black/20 to-transparent">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-16 lg:mb-20 text-center">
                 <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tighter">
                    Engineering <span className="text-earth-clay italic">Solutions.</span>
                 </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                 {problemsSolved.map((problem, i) => (
                    <motion.div
                       key={i}
                       initial={{ opacity: 0, y: 30 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true, margin: "-50px" }}
                       transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                       <Card className="h-full p-10 aura-glass-heavy border-white/5 group hover:border-earth-clay/40 transition-all duration-500 overflow-hidden relative">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-earth-clay/5 rounded-full blur-[60px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-150" />
                          <div className="relative z-10">
                             <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:bg-earth-clay/10 group-hover:border-earth-clay/30 transition-all duration-500">
                                <problem.icon className="text-earth-clay" size={26} />
                             </div>
                             <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{problem.title}</h3>
                             <p className="text-base text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                                {problem.desc}
                             </p>
                          </div>
                       </Card>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* ── ENTERPRISE-GRADE INFRASTRUCTURE ── */}
        <section className="py-24 sm:py-32 lg:py-40 relative bg-gradient-to-b from-transparent to-black/20">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                 <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1 }}
                 >
                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tighter leading-[1.1]">
                       Built For <span className="text-earth-clay italic">Scale.</span>
                    </h2>
                    <p className="text-lg text-slate-400 font-light leading-relaxed mb-10">
                       We don't build websites; we build mission-critical infrastructure. FitXeno OS is hosted on globally distributed edge networks, ensuring immediate data retrieval and bank-grade security protocols for your operational data.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                       {infrastructure.map((item, i) => (
                          <div key={i} className="border-l-2 border-earth-clay/30 pl-4">
                             <div className="flex items-center space-x-2 mb-2">
                                <item.icon size={14} className="text-slate-500" />
                                <span className="label-text !text-slate-500 !text-[9px] uppercase">{item.label}</span>
                             </div>
                             <p className="text-2xl font-black text-white tracking-tight">{item.value}</p>
                          </div>
                       ))}
                    </div>
                 </motion.div>

                 <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, delay: 0.2 }}
                 >
                    <Card className="aura-glass-heavy border-white/5 p-8 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-earth-clay/5 to-transparent opacity-50" />
                       <div className="relative z-10">
                          <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                             <div>
                                <h4 className="text-white font-bold text-lg mb-1">System Architecture</h4>
                                <p className="text-xs text-emerald-400 font-medium tracking-wide">All Systems Operational</p>
                             </div>
                             <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <ShieldCheck className="text-emerald-400" size={20} />
                             </div>
                          </div>
                          <div className="space-y-6">
                             {[
                                { name: 'Authentication Layer', latency: '12ms' },
                                { name: 'Database Replication', latency: '4ms' },
                                { name: 'Analytics Engine', latency: '28ms' }
                             ].map((sys, i) => (
                                <div key={i} className="flex justify-between items-center">
                                   <span className="text-sm font-medium text-slate-300">{sys.name}</span>
                                   <span className="text-xs font-mono text-slate-500">{sys.latency}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </Card>
                 </motion.div>
              </div>
           </div>
        </section>

        {/* ── THE FUTURE ROADMAP ── */}
        <section className="py-24 sm:py-32 lg:py-40 relative bg-transparent">
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 lg:mb-20">
                 <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tighter">
                    The Platform <span className="text-earth-clay italic">Roadmap.</span>
                 </h2>
                 <p className="text-slate-400">Continuous innovation. Absolute evolution.</p>
              </div>

              <div className="relative space-y-12">
                 <div className="absolute left-6 sm:left-[39px] top-0 bottom-0 w-px bg-gradient-to-b from-earth-clay via-earth-clay/20 to-transparent" />
                 
                 {roadmap.map((item, i) => (
                    <motion.div 
                       key={i}
                       initial={{ opacity: 0, x: -20 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true, margin: "-100px" }}
                       transition={{ delay: i * 0.2, duration: 0.8 }}
                       className="relative pl-20 sm:pl-28"
                    >
                       <div className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-obsidian border border-earth-clay/50 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(160,82,45,0.3)] group-hover:border-earth-clay group-hover:shadow-[0_0_30px_rgba(160,82,45,0.6)] transition-all duration-500">
                          <div className="absolute inset-0 rounded-full bg-earth-clay/20 animate-pulse" />
                          <Cpu size={16} className="text-earth-clay relative z-10" />
                       </div>
                       <Card className="p-6 sm:p-8 aura-glass border-white/5 group hover:bg-white/[0.03] transition-colors">
                          <span className="label-text !text-earth-clay !text-[10px] uppercase mb-2 block">{item.phase}</span>
                          <h3 className="text-xl font-black text-white mb-3 tracking-tight">{item.title}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed font-light">{item.desc}</p>
                       </Card>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-24 sm:py-32 lg:py-40 relative overflow-hidden bg-gradient-to-b from-transparent via-obsidian to-obsidian">
          <div className="absolute inset-0 z-0 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-earth-clay/15 blur-[180px] rounded-full" />
          </div>
          
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1 }}
            >
               <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tighter leading-[1] drop-shadow-2xl">
                 Initialize Your <br />
                 <span className="text-earth-clay italic">Enterprise.</span>
               </h2>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-12 lg:mt-16">
                 <Link to="/login" className="w-full sm:w-auto group relative px-10 py-5 bg-earth-clay hover:bg-[#b0613a] rounded-xl text-white text-base font-bold transition-all flex justify-center items-center shadow-[0_0_40px_rgba(160,82,45,0.4)] overflow-hidden ring-1 ring-white/20">
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                   <span className="relative z-10 flex items-center drop-shadow-md">Access Portal <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" /></span>
                 </Link>
                 <Link to="/contact" className="w-full sm:w-auto group px-10 py-5 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-xl text-white text-base font-bold transition-all flex justify-center items-center shadow-2xl ring-1 ring-white/5">
                   Book Enterprise Demo
                 </Link>
               </div>
            </motion.div>
          </div>
        </section>

        <PublicFooter />
      </div>
    </PageTransition>
  );
};

export default About;
