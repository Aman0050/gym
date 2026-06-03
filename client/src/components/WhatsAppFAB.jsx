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
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" className="text-white relative z-10 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
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
