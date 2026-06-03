import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard,
  Calendar, Settings, Shield, Zap,
  BarChart3, Bell, HelpCircle,
  Building2, X, LifeBuoy, ServerCrash, Activity
} from 'lucide-react';
import logo from '../assets/logo-fitxeno.svg';
import lionIcon from '../assets/flaming-lion.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { transitions } from './ui/transitions';
import api from '../services/api';

const Sidebar = ({ onNotificationsClick, onSettingsClick, onHelpClick, isOpen, onClose, isMobile }) => {
  const { unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [healthStatus, setHealthStatus] = useState({
    status: 'OPERATIONAL',
    message: 'All systems running smoothly',
    uptimePct: 98,
    color: 'emerald-400',
    bgColor: 'emerald-500'
  });

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const start = Date.now();
        const res = await api.get('/health', { timeout: 5000 });
        const latency = Date.now() - start;
        
        if (!isMounted) return;

        if (res.data.status === 'healthy') {
          if (latency > 1500) {
            setHealthStatus({
              status: 'DEGRADED',
              message: 'High latency detected',
              uptimePct: 92,
              color: 'amber-400',
              bgColor: 'amber-500'
            });
          } else {
            setHealthStatus({
              status: 'OPERATIONAL',
              message: 'All systems running smoothly',
              uptimePct: 99,
              color: 'emerald-400',
              bgColor: 'emerald-500'
            });
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setHealthStatus({
          status: 'OFFLINE',
          message: 'Server connection lost',
          uptimePct: 0,
          color: 'red-400',
          bgColor: 'red-500'
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
          <img src={lionIcon} alt="FitXeno Icon" className="h-12 sm:h-16 w-12 sm:w-16 object-contain relative z-10 mb-2 scale-[1.30] lion-mask" />
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
      <div className="p-5 space-y-5 flex-shrink-0">
        {/* System Status */}
        <div className={`p-5 bg-white/[0.02] rounded-3xl border border-${healthStatus.color}/10 group cursor-default hover:border-${healthStatus.color}/30 transition-all duration-300 relative overflow-hidden`}>
          {healthStatus.status === 'OFFLINE' && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
          <div className="flex items-center justify-between mb-3.5 relative z-10">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full bg-${healthStatus.bgColor} ${healthStatus.status === 'OPERATIONAL' ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                SYSTEM STATUS
              </span>
            </div>
            <span className={`text-[9px] font-black text-${healthStatus.color} uppercase tracking-wider whitespace-nowrap`}>
              {healthStatus.status}
            </span>
          </div>
          <p className={`text-[9px] font-bold ${healthStatus.status === 'OFFLINE' ? 'text-red-400' : 'text-slate-500'} uppercase tracking-wider mb-3 leading-none relative z-10`}>
            {healthStatus.message}
          </p>
          <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden relative z-10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${healthStatus.uptimePct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-${healthStatus.color} shadow-[0_0_8px_currentColor]`}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-[8px] font-black text-slate-600 uppercase tracking-widest relative z-10">
            <span>{healthStatus.uptimePct}% Operational</span>
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
