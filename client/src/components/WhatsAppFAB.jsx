import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WhatsAppFAB = () => {
  return (
    <a 
      href="https://wa.me/919310786512" 
      target="_blank" 
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-[9999] group cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center justify-center"
      >
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/40 transition-colors duration-500" />
        
        {/* Pulse Ring */}
        <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        
        {/* Button */}
        <div className="relative w-14 h-14 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 border border-emerald-300/30 overflow-hidden">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <MessageCircle size={28} className="text-white relative z-10" />
        </div>

        {/* Tooltip */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
          <div className="bg-obsidian/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl shadow-xl flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Quick Connect</span>
          </div>
        </div>
      </motion.div>
    </a>
  );
};

export default WhatsAppFAB;
