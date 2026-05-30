import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard,
  Calendar, Settings, Shield, Zap,
  BarChart3, Bell, HelpCircle,
  Building2, X, LifeBuoy
} from 'lucide-react';
import logo from '../assets/logo-fitxeno.svg';
import lionIcon from '../assets/flaming-lion.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { transitions } from './ui/transitions';

const Sidebar = ({ onNotificationsClick, onSettingsClick, onHelpClick, isOpen, onClose, isMobile }) => {
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const menuItems = isSuperAdmin
    ? [
        { name: 'Dashboard',  icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Branches',   icon: Building2,       path: '/gyms' },
        { name: 'Support',    icon: LifeBuoy,        path: '/super-admin/support/tickets' }
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
          className="flex items-center group cursor-pointer"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          aria-label="FitNexo home"
        >
          <img src={lionIcon} alt="FitXeno Icon" className="h-12 sm:h-16 w-12 sm:w-16 object-contain relative z-10 mb-2 scale-[1.30]" />
          <img src={logo} alt="FitXeno" className="h-8 sm:h-10 object-contain relative z-10 mb-2 -ml-2 sm:-ml-3" style={{ filter: 'brightness(0.95) contrast(1.05)' }} />
          <div className="hidden">
            <p className="label-text !text-[7px] mt-1 opacity-50">Enterprise Gym Operations Platform</p>
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
        <p className="label-text !text-[10px] !text-slate-400 uppercase tracking-[0.3em] px-4 mb-4">
          {isSuperAdmin ? 'Network Administration' : 'Management'}
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const isManuallyActive = 
              (item.path === '/gyms' && location.pathname.startsWith('/super-admin/branches/')) ||
              (item.path === '/super-admin/support/tickets' && location.pathname.startsWith('/super-admin/support/tickets/')) ||
              (item.path === '/members' && location.pathname.startsWith('/members/profile/'));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isMobile && onClose()}
                className={({ isActive }) => {
                  const active = isActive || isManuallyActive;
                  return `
                  group flex items-center px-4 py-3.5 rounded-2xl
                  transition-colors duration-200 relative overflow-hidden
                  ${active
                    ? 'bg-earth-clay/10 text-earth-clay'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                  }
                `}}
              >
                {({ isActive }) => {
                  const active = isActive || isManuallyActive;
                  return (
                  <>
                    {active && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 top-2 bottom-2 w-0.5 bg-earth-clay rounded-r-full shadow-[0_0_12px_rgba(160,82,45,0.8)]"
                      />
                    )}
                    <item.icon
                      size={17}
                      className={`mr-3.5 flex-shrink-0 transition-transform duration-300 ${
                        active ? '' : 'group-hover:scale-105 group-hover:text-earth-clay'
                      }`}
                    />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                      {item.name}
                    </span>
                  </>
                )}}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="p-5 border-t border-white/[0.05] space-y-5 flex-shrink-0">
        {/* System Status */}
        <div className="p-5 bg-white/[0.02] rounded-3xl border border-white/[0.05] group cursor-default hover:border-earth-clay/15 transition-all duration-300">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                SYSTEM STATUS
              </span>
            </div>
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">
              OPERATIONAL
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3 leading-none">
            All systems running smoothly
          </p>
          <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '98%' }}
              transition={transitions.slow}
              className="h-full bg-earth-clay shadow-[0_0_8px_rgba(160,82,45,0.8)]"
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-[8px] font-black text-slate-600 uppercase tracking-widest">
            <span>98% Operational</span>
            <span>v5.0 Enterprise</span>
          </div>
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
