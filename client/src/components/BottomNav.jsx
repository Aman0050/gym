import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard,
  Calendar, MoreHorizontal,
} from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = ({ onMenuClick }) => {
  const navItems = [
    { name: 'Home',       icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Members',    icon: Users,           path: '/members' },
    { name: 'Payments',   icon: CreditCard,      path: '/payments' },
    { name: 'Attendance', icon: Calendar,        path: '/attendance' },
  ];

  const handleMoreClick = () => {
    // Haptic feedback on supported devices
    if (navigator.vibrate) navigator.vibrate(10);
    onMenuClick();
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#080808]/90 backdrop-blur-2xl border-t border-white/[0.06] pb-safe-area">
      <div className="flex items-center justify-around px-1 pt-2 pb-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center gap-1.5
              touch-target min-w-[64px] px-2 py-2 rounded-2xl
              transition-colors duration-200
              ${isActive ? 'text-earth-clay' : 'text-slate-600 hover:text-slate-400'}
            `}
            onClick={() => { if (navigator.vibrate) navigator.vibrate(8); }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute inset-0 bg-earth-clay/10 rounded-2xl"
                  />
                )}
                <item.icon
                  size={20}
                  className={`relative z-10 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`}
                />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] relative z-10 leading-none">
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-dot"
                    className="absolute top-1.5 w-1 h-1 rounded-full bg-earth-clay shadow-[0_0_6px_rgba(160,82,45,1)]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={handleMoreClick}
          className="flex flex-col items-center gap-1.5 touch-target min-w-[64px] px-2 py-2 rounded-2xl text-slate-600 hover:text-slate-400 transition-colors"
          aria-label="More options"
        >
          <MoreHorizontal size={20} />
          <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none">More</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
