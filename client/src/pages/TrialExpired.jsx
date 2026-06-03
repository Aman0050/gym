import { Link } from 'react-router-dom';
import { ShieldAlert, CreditCard, Headphones, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui';

const TrialExpired = () => {
  const openWhatsApp = () => {
    const text = encodeURIComponent("Hello FitXeno Team, my trial has expired. I'd like to upgrade my subscription.");
    window.open(`https://wa.me/919310786512?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl p-8 sm:p-12 text-center aura-glass-heavy relative z-10 shadow-2xl"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mx-auto mb-8">
          <ShieldAlert className="text-red-500 w-10 h-10" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-white mb-4">
          Your Trial Period Has Ended
        </h1>
        
        <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
          Upgrade your subscription to continue managing members, payments, attendance, and analytics. 
          Don't let your gym operations halt.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full !py-4 !px-8 flex items-center justify-center gap-2 shadow-xl">
              <CreditCard size={18} />
              Upgrade Now
            </Button>
          </Link>
          
          <Button variant="secondary" onClick={openWhatsApp} className="w-full sm:w-auto !py-4 !px-8 flex items-center justify-center gap-2 border-white/5">
            <MessageCircle size={18} className="text-[#25D366]" />
            WhatsApp Team
          </Button>

          <a href="mailto:sales@fitxeno.com" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full !py-4 !px-8 flex items-center justify-center gap-2 border-white/5">
              <Headphones size={18} />
              Contact Sales
            </Button>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default TrialExpired;
