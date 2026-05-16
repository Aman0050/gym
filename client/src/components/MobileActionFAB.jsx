import React, { useState } from 'react';
import { Plus, UserPlus, CreditCard, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MobileActionFAB = () => {
  const triggerPalette = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    // Dispatch custom event to open CommandPalette
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      metaKey: true
    }));
  };

  return (
    <div className="lg:hidden fixed bottom-24 right-5 z-[110]">
      {/* Main Aura FAB */}
      <motion.button
        whileTap={{ scale: 0.9, rotate: -15 }}
        onClick={triggerPalette}
        className="w-16 h-16 bg-earth-clay rounded-[2rem] flex items-center justify-center text-white shadow-2xl border border-white/10 relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute inset-0 satin-shimmer opacity-30" />
        
        {/* Bioluminescent Ring */}
        <div className="absolute inset-0 border-2 border-white/20 rounded-[2rem] animate-pulse" />
        
        <Search size={24} className="relative z-10" />
      </motion.button>
    </div>
  );
};

export default MobileActionFAB;
