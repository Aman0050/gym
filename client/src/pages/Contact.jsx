import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, Server, Globe, Send, CheckCircle2, CircleDashed,
  Phone, Handshake, BarChart3, Lock, Mail,
  ArrowRight, Activity, TrendingUp, Users, Cpu, Clock, CreditCard
} from 'lucide-react';
import { useState, useEffect } from 'react';
import loginHero from '../assets/login_hero.jpg';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { Card, Button } from '../components/ui';
import { PageTransition } from '../components/Animations';
import { useNotificationStore } from '../store/useNotificationStore';
import { Link } from 'react-router-dom';

const HeroParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100 + 20}%`,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
      size: Math.random() * 4 + 2,
    })));
  }, []);

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-earth-clay/40"
          style={{ width: p.size, height: p.size, left: p.left, top: p.top, boxShadow: '0 0 10px rgba(160,82,45,0.5)' }}
          animate={{
            y: [0, -800],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const TrustSection = () => (
  <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-32 bg-transparent z-20 -mt-16 sm:-mt-24 pointer-events-none">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 text-center divide-x divide-white/5 aura-glass-heavy p-8 sm:p-12 rounded-3xl bg-black/20 backdrop-blur-2xl ring-1 ring-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col items-center">
             <div className="text-4xl lg:text-5xl font-black text-white mb-2 font-serif tracking-tight text-glow">99.99<span className="text-earth-clay">%</span></div>
             <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">Platform Uptime</div>
          </div>
          <div className="flex flex-col items-center">
             <div className="text-4xl lg:text-5xl font-black text-white mb-2 font-serif tracking-tight text-glow">10M<span className="text-earth-clay">+</span></div>
             <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">Member Check-ins</div>
          </div>
          <div className="flex flex-col items-center">
             <div className="text-4xl lg:text-5xl font-black text-white mb-2 font-serif tracking-tight text-glow">$50M<span className="text-earth-clay">+</span></div>
             <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">Transactions</div>
          </div>
          <div className="flex flex-col items-center">
             <div className="text-4xl lg:text-5xl font-black text-white mb-2 font-serif tracking-tight text-glow">500<span className="text-earth-clay">+</span></div>
             <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">Active Gyms</div>
          </div>
       </div>
    </div>
  </section>
);

const WhyFitXenoSection = () => {
  const features = [
    { icon: TrendingUp, title: "Revenue Growth", desc: "Automated billing and churn prevention algorithms that immediately impact your bottom line." },
    { icon: Cpu, title: "Business Automation", desc: "Eliminate manual tasks with our AI-driven workflow engine and zero-touch operations." },
    { icon: Activity, title: "Attendance Intelligence", desc: "Biometric and RFID integrations providing real-time facility load balancing." },
    { icon: Server, title: "Multi-Branch Operations", desc: "Centralized command center designed specifically for franchise and enterprise scaling." },
    { icon: Users, title: "Member Retention", desc: "Predictive analytics identifying at-risk members before they cancel their subscriptions." },
    { icon: CreditCard, title: "Fintech Grade Payments", desc: "Military-grade encrypted payment processing with dynamic routing and retry logic." }
  ];

  return (
    <section className="py-24 sm:py-32 lg:py-40 relative z-10 bg-gradient-to-b from-transparent via-black/20 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
            <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight mb-6">Why Industry Leaders Choose <span className="text-earth-clay">FitXeno</span></h2>
            <p className="text-slate-400 text-lg leading-relaxed">Built from the ground up to solve the most complex operational bottlenecks in the fitness industry.</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
           {features.map((feat, i) => (
             <Card key={i} className="p-8 aura-glass premium-card-hover group relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-earth-clay/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-earth-clay/20 group-hover:border-earth-clay/30 transition-all duration-300">
                  <feat.icon className="text-slate-300 group-hover:text-white transition-colors" size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feat.title}</h3>
               <p className="text-slate-400 text-sm leading-relaxed relative z-10">{feat.desc}</p>
             </Card>
           ))}
         </div>
      </div>
    </section>
  );
};

const FinalCTA = () => (
  <section className="py-24 sm:py-32 lg:py-40 relative z-10 bg-gradient-to-b from-transparent via-obsidian to-obsidian overflow-hidden">
     <div className="absolute inset-0 z-0">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(160,82,45,0.15)_0%,transparent_60%)]" />
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[400px] bg-earth-clay/20 blur-[150px] mix-blend-screen" />
     </div>
     <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white font-serif tracking-tighter mb-8 drop-shadow-2xl">
          Ready To Modernize Your <br className="hidden sm:block" />Gym Business?
        </h2>
        <p className="text-xl sm:text-2xl text-slate-400 font-light leading-relaxed mb-12 max-w-3xl mx-auto">
          Stop managing members with spreadsheets and disconnected tools. Join the next generation of fitness businesses.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
           <button onClick={() => document.getElementById('inquiry-form').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-slate-100 rounded-xl text-obsidian text-base font-black transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 flex justify-center items-center">
             Book Enterprise Demo <ArrowRight size={18} className="ml-2" />
           </button>
           <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-base font-bold transition-all backdrop-blur-md shadow-xl hover:scale-105 flex justify-center items-center">
             Client Portal
           </Link>
        </div>
     </div>
  </section>
);

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '', gymName: '', email: '', phone: '',
    branchCount: '', memberCount: '', businessGoals: '', message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const addNotification = useNotificationStore(state => state.addNotification);

  const leadershipTeam = [
    { name: 'Sufyan Khan', role: 'Founder & Platform Owner', phone: '+91 9310786512' },
    { name: 'Aman Naeem', role: 'Co-Founder & Operations', phone: '+91 7827392589' }
  ];

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("https://formsubmit.co/ajax/contact.fitxeno@gmail.com", {
          method: "POST",
          headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({
              _subject: "New Enterprise Consultation Request - FitXeno",
              _template: "table",
              _honey: "", // Honeypot to prevent bot spam
              Name: formData.fullName,
              "Gym Name": formData.gymName,
              Email: formData.email,
              Phone: formData.phone || 'Not provided',
              "Branch Count": formData.branchCount || 'Not specified',
              "Member Count": formData.memberCount || 'Not specified',
              "Business Goals": formData.businessGoals || 'Not specified',
              Message: formData.message
          })
      });

      if (!response.ok) throw new Error("Transmission failed");

      setIsSubmitting(false);
      setIsSuccess(true);
      addNotification('Success', 'Secure enterprise payload transmitted successfully.', 'success');
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ fullName: '', gymName: '', email: '', phone: '', branchCount: '', memberCount: '', businessGoals: '', message: '' });
      }, 6000);
    } catch (error) {
      setIsSubmitting(false);
      addNotification('Error', 'Transmission failed. Please try again or email directly.', 'error');
    }
  };

  return (
    <PageTransition>
      <div className="bg-obsidian min-h-screen text-slate-300 selection:bg-earth-clay/20 font-sans relative">
        <PublicNavbar />

        {/* ── PREMIUM ENTERPRISE HERO SECTION (5-LAYER SYSTEM) ── */}
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

          {/* Layer 3: Ambient Radial Glows & Particles */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
             <motion.div 
               animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1] }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-earth-clay/40 blur-[200px] rounded-[100%] mix-blend-screen" 
             />
             <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                  backgroundSize: '60px 60px',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
                }}
             />
             <HeroParticles />
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
                
                {/* Layer 5: Typography & CTAs (Focal Points) */}
                <div className="relative z-20">
                  <div className="mb-6 flex justify-center">
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: 0.2, duration: 0.6 }}
                       className="inline-flex items-center space-x-2 bg-black/40 border border-white/10 px-4 py-1.5 rounded-full shadow-inner ring-1 ring-white/5"
                     >
                       <div className="w-2 h-2 rounded-full bg-earth-clay animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">FitXeno Enterprise</span>
                     </motion.div>
                  </div>
                  
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tighter leading-[1] drop-shadow-2xl">
                    Scale Without <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-earth-clay to-orange-600">Limits.</span>
                  </h1>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light mb-10 tracking-tight"
                  >
                    Engineering the operational infrastructure for the world's most elite fitness networks. Architect your future.
                  </motion.p>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                  >
                     <button onClick={() => document.getElementById('inquiry-form').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto group relative px-10 py-5 bg-earth-clay hover:bg-[#b0613a] rounded-xl text-white text-base font-bold transition-all flex justify-center items-center shadow-[0_0_40px_rgba(160,82,45,0.4)] overflow-hidden ring-1 ring-white/20">
                       <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                       <span className="relative z-10 flex items-center drop-shadow-md">Architect Your Solution <Send size={16} className="ml-3 group-hover:translate-x-1 transition-transform" /></span>
                     </button>
                     <a href="https://wa.me/919310786512" target="_blank" rel="noreferrer" className="w-full sm:w-auto group px-10 py-5 bg-white/[0.03] hover:bg-emerald-500/[0.08] hover:border-emerald-500/30 backdrop-blur-xl border border-white/10 rounded-xl text-white text-base font-bold transition-all flex justify-center items-center shadow-2xl ring-1 ring-white/5">
                       WhatsApp Connect 
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="ml-3 text-slate-400 group-hover:text-emerald-400 transition-colors fill-current">
                         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                       </svg>
                     </a>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </main>
        </section>

        <TrustSection />
        <WhyFitXenoSection />

        <section className="py-24 sm:py-32 lg:py-40 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start relative z-20">
              
              {/* ── LEFT: PLATFORM LEADERSHIP ── */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5 space-y-8 lg:sticky lg:top-32"
              >
                <div>
                   <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-6 shadow-xl">
                     <Clock size={12} className="text-earth-clay" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Platform Engineering Team</span>
                   </div>
                   <h3 className="text-4xl lg:text-5xl font-serif font-black text-white mb-4 tracking-tight leading-[1.1]">Speak to the <br />Builders.</h3>
                   <p className="text-slate-400 text-base leading-relaxed mb-10">We don't route you through generic support. Enterprise clients get direct access to our core architects and operational leaders.</p>
                   
                   <div className="space-y-5">
                     {leadershipTeam.map((member, i) => (
                       <Card key={i} className="p-6 aura-glass-heavy premium-card-hover group relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ring-1 ring-white/5">
                         <div className="absolute inset-0 bg-gradient-to-r from-earth-clay/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                         <div className="relative z-10 flex items-center space-x-5">
                           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-earth-clay to-[#8b4513] flex items-center justify-center border border-earth-clay/50 shadow-[0_0_20px_rgba(160,82,45,0.3)] shrink-0 group-hover:scale-110 transition-transform duration-500">
                             <span className="text-white font-black text-2xl font-serif">
                               {member.name.split(' ').map(n => n[0]).join('')}
                             </span>
                           </div>
                           <div>
                             <p className="text-white font-black text-xl leading-tight group-hover:text-earth-clay transition-colors">{member.name}</p>
                             <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">{member.role}</p>
                           </div>
                         </div>
                         <a href={`tel:${member.phone.replace(/\s/g, '')}`} className="relative z-10 inline-flex items-center justify-center w-full sm:w-auto bg-white/5 hover:bg-earth-clay px-6 py-3 rounded-xl border border-white/10 hover:border-earth-clay transition-all text-sm font-bold text-white shadow-xl group-hover:shadow-[0_0_20px_rgba(160,82,45,0.4)]">
                            <Phone size={16} className="mr-2 text-white/70 group-hover:text-white" />
                            Contact
                         </a>
                       </Card>
                     ))}
                   </div>
                </div>
              </motion.div>

              {/* ── RIGHT: ENTERPRISE INQUIRY PORTAL ── */}
              <motion.div 
                id="inquiry-form"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-7 relative z-20"
              >
                <Card className="p-8 sm:p-12 aura-glass-heavy bg-obsidian/90 backdrop-blur-3xl relative overflow-hidden h-full ring-1 ring-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                   <div className="absolute inset-0 bg-gradient-to-br from-earth-clay/10 via-transparent to-transparent opacity-50" />
                   
                   <AnimatePresence mode="wait">
                     {isSuccess ? (
                       <motion.div
                         key="success"
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="flex flex-col items-center justify-center w-full h-full min-h-[600px] text-center relative z-10"
                       >
                         <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
                         <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                         >
                           <CheckCircle2 size={56} className="text-emerald-400" />
                         </motion.div>
                         <h3 className="text-3xl sm:text-4xl font-black font-serif text-white mb-4 whitespace-nowrap">Transmission Secure</h3>
                         <p className="text-slate-400 text-base sm:text-lg font-light leading-relaxed px-4" style={{ minWidth: '300px', maxWidth: '450px', width: '100%' }}>
                           Our engineering and sales team has received your encrypted payload. A platform architect will contact you shortly.
                         </p>
                       </motion.div>
                     ) : (
                       <motion.form 
                         key="form"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         onSubmit={handleSubmit} 
                         className="space-y-8 relative z-10"
                       >
                          <div className="mb-8 border-b border-white/5 pb-8">
                             <div className="flex items-center space-x-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-earth-clay animate-pulse shadow-[0_0_10px_rgba(160,82,45,0.8)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-earth-clay">Secure Intake Portal</span>
                             </div>
                             <h2 className="text-3xl font-serif font-black text-white tracking-tight">Enterprise Consultation</h2>
                             <p className="text-slate-400 text-sm mt-2">Initialize a secure dialogue with our infrastructure team.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-earth-clay transition-colors">Full Name <span className="text-earth-clay">*</span></label>
                              <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field !py-4 !px-5 !rounded-xl !bg-black/40 !border-white/10 focus:!border-earth-clay/50 focus:!bg-black/60 transition-all shadow-inner" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2 group">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-earth-clay transition-colors">Company / Gym Name <span className="text-earth-clay">*</span></label>
                              <input required type="text" name="gymName" value={formData.gymName} onChange={handleChange} className="input-field !py-4 !px-5 !rounded-xl !bg-black/40 !border-white/10 focus:!border-earth-clay/50 focus:!bg-black/60 transition-all shadow-inner" placeholder="Titan Fitness Inc." />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-earth-clay transition-colors">Work Email <span className="text-earth-clay">*</span></label>
                              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="input-field !py-4 !px-5 !rounded-xl !bg-black/40 !border-white/10 focus:!border-earth-clay/50 focus:!bg-black/60 transition-all shadow-inner" placeholder="john@titanfitness.com" />
                            </div>
                            <div className="space-y-2 group">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-earth-clay transition-colors">Direct Phone</label>
                              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field !py-4 !px-5 !rounded-xl !bg-black/40 !border-white/10 focus:!border-earth-clay/50 focus:!bg-black/60 transition-all shadow-inner" placeholder="+91 99999 99999" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-earth-clay transition-colors">Facility Count</label>
                              <select name="branchCount" value={formData.branchCount} onChange={handleChange} className="select-field !py-4 !px-5 !rounded-xl !bg-black/40 !border-white/10 focus:!border-earth-clay/50 focus:!bg-black/60 transition-all shadow-inner cursor-pointer">
                                <option value="">Select Scale...</option>
                                <option value="1">Single Location</option>
                                <option value="2-5">2 - 5 Branches</option>
                                <option value="6-15">6 - 15 Branches</option>
                                <option value="15+">15+ (Enterprise Network)</option>
                              </select>
                            </div>
                            <div className="space-y-2 group">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-earth-clay transition-colors">Active Member Base</label>
                              <select name="memberCount" value={formData.memberCount} onChange={handleChange} className="select-field !py-4 !px-5 !rounded-xl !bg-black/40 !border-white/10 focus:!border-earth-clay/50 focus:!bg-black/60 transition-all shadow-inner cursor-pointer">
                                <option value="">Select Volume...</option>
                                <option value="0-500">0 - 500 Members</option>
                                <option value="501-2000">501 - 2,000 Members</option>
                                <option value="2000-5000">2,000 - 5,000 Members</option>
                                <option value="5000+">5,000+ Members</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2 group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-earth-clay transition-colors">Primary Business Goal</label>
                            <input type="text" name="businessGoals" value={formData.businessGoals} onChange={handleChange} className="input-field !py-4 !px-5 !rounded-xl !bg-black/40 !border-white/10 focus:!border-earth-clay/50 focus:!bg-black/60 transition-all shadow-inner" placeholder="e.g. Stop revenue leakage, scale to 5 branches..." />
                          </div>

                          <div className="space-y-2 group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 group-focus-within:text-earth-clay transition-colors">Operational Challenges <span className="text-earth-clay">*</span></label>
                            <textarea required name="message" value={formData.message} onChange={handleChange} rows={4} className="input-field !py-4 !px-5 !rounded-xl !bg-black/40 !border-white/10 focus:!border-earth-clay/50 focus:!bg-black/60 transition-all shadow-inner resize-none" placeholder="Detail your current software stack and where it is failing..." />
                          </div>

                          <div className="pt-6">
                            <div className="flex items-center justify-center space-x-2 mb-6">
                               <Lock size={12} className="text-emerald-500/70" />
                               <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">End-to-End Encrypted Payload</span>
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full relative overflow-hidden bg-white !text-obsidian hover:bg-slate-100 !py-5 !rounded-xl font-black text-sm tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all duration-500 border-0">
                            {isSubmitting ? (
                              <span className="flex items-center justify-center relative z-10">
                                <CircleDashed className="animate-spin mr-3 text-earth-clay" size={18} />
                                Transmitting...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center relative z-10">
                                Initialize Secure Consultation <Send size={18} className="ml-3 text-earth-clay" />
                              </span>
                            )}
                            </Button>
                          </div>
                       </motion.form>
                     )}
                   </AnimatePresence>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <FinalCTA />
        <PublicFooter />
      </div>
    </PageTransition>
  );
};

export default Contact;
