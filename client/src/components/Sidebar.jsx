import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard,
  Calendar, Settings, Shield, Zap,
  BarChart3, Bell, HelpCircle,
  Building2, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { transitions } from './ui';

const Sidebar = ({ onNotificationsClick, onSettingsClick, onHelpClick, isOpen, onClose, isMobile }) => {
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const menuItems = isSuperAdmin
    ? [
        { name: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Branches',   icon: Building2,       path: '/gyms' },
      ]
    : [
        { name: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Members',    icon: Users,           path: '/members' },
        { name: 'Payments',   icon: CreditCard,      path: '/payments' },
        { name: 'Attendance', icon: Calendar,        path: '/attendance' },
        { name: 'Plans',      icon: BarChart3,       path: '/plans' },
      ];

  const content = (
    <div
      className={`flex flex-col h-full ${
        isMobile ? 'w-full' : 'w-72'
      } bg-[#080808]/95 backdrop-blur-3xl border-r border-white/[0.06] relative z-30 shadow-[12px_0_40px_-4px_rgba(0,0,0,0.5)]`}
    >
      {/* ── Brand Header ── */}
      <div className="px-8 pt-8 pb-10 flex items-center justify-between flex-shrink-0">
        <div
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          aria-label="FitVibe home"
        >
          <div className="w-11 h-11 bg-earth-clay rounded-2xl flex items-center justify-center shadow-xl shadow-earth-clay/25 group-hover:rotate-12 transition-transform duration-700 relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 satin-shimmer opacity-20" />
            <Zap className="text-white relative z-10" size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-black text-ivory tracking-tighter leading-none">
              FITVIBE
            </h1>
            <p className="label-text !text-[7px] mt-1 opacity-50">Premium Management</p>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            className="touch-target w-10 h-10 flex items-center justify-center text-slate-500 hover:text-ivory hover:bg-white/5 rounded-xl transition-all ml-2"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-4 overflow-y-auto premium-scrollbar">
        <p className="label-text !text-[7px] !text-slate-700 uppercase tracking-[0.3em] px-4 mb-4">
          {isSuperAdmin ? 'Network Administration' : 'Management'}
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => isMobile && onClose()}
              className={({ isActive }) => `
                group flex items-center px-4 py-3.5 rounded-2xl
                transition-colors duration-200 relative overflow-hidden
                ${isActive
                  ? 'bg-earth-clay/10 text-earth-clay'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-2 bottom-2 w-0.5 bg-earth-clay rounded-r-full shadow-[0_0_12px_rgba(160,82,45,0.8)]"
                    />
                  )}
                  <item.icon
                    size={17}
                    className={`mr-3.5 flex-shrink-0 transition-transform duration-300 ${
                      isActive ? '' : 'group-hover:scale-105 group-hover:text-earth-clay'
                    }`}
                  />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="p-5 border-t border-white/[0.05] space-y-5 flex-shrink-0">
        {/* System Status */}
        <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/[0.05] group cursor-default hover:border-earth-clay/10 transition-colors">
          <div className="flex items-center justify-between mb-3.5">
            <Shield size={14} className="text-earth-clay" />
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
              {isSuperAdmin ? 'Platform Hub' : 'v5.0 Enterprise'}
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
            {isSuperAdmin ? 'Network Status' : 'System Status'}
          </p>
          <div className="w-full h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: isSuperAdmin ? '100%' : '92%' }}
              transition={transitions.slow}
              className="h-full bg-earth-clay shadow-[0_0_8px_rgba(160,82,45,0.8)]"
            />
          </div>
          <p className="text-[8px] text-slate-700 font-semibold mt-2">
            {isSuperAdmin ? '100% Operational' : '92% Operational'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around">
          <button
            onClick={onSettingsClick}
            className="touch-target w-10 h-10 flex items-center justify-center text-slate-500 hover:text-earth-clay hover:bg-white/[0.05] rounded-xl transition-all"
            aria-label="Settings"
          >
            <Settings size={17} />
          </button>
          <button
            onClick={onNotificationsClick}
            className="touch-target w-10 h-10 flex items-center justify-center text-slate-500 hover:text-earth-clay hover:bg-white/[0.05] rounded-xl transition-all relative"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-earth-clay rounded-full shadow-[0_0_8px_rgba(160,82,45,0.8)] ring-2 ring-[#080808]" />
            )}
          </button>
          <button
            onClick={onHelpClick}
            className="touch-target w-10 h-10 flex items-center justify-center text-slate-500 hover:text-earth-clay hover:bg-white/[0.05] rounded-xl transition-all"
            aria-label="Help"
          >
            <HelpCircle size={17} />
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile drawer
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={transitions.normal}
              className="fixed inset-y-0 left-0 w-4/5 max-w-[300px] z-[160]"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return <aside className="hidden lg:flex h-full flex-shrink-0">{content}</aside>;
};

export default Sidebar;
