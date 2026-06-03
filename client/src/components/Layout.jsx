import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import NotificationHub from './NotificationHub';
import SettingsHub from './SettingsHub';
import HelpHub from './HelpHub';
import { Search, User, Menu, Bell, LogOut, Shield, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { getDisplayName } from '../utils/userUtils';
import { Toaster } from 'react-hot-toast';
import QuickSearch from './QuickSearch';
import MobileActionFAB from './MobileActionFAB';
import OfflineSyncHub from './OfflineSyncHub';

/** Route → human-readable label map */
const ROUTE_LABELS = {
  '/dashboard':        'Dashboard',
  '/members':          'Members',
  '/payments':         'Payments',
  '/attendance':       'Attendance',
  '/plans':            'Plans',
  '/gyms':             'Branches',
};

const getRouteLabel = (pathname) => {
  if (pathname.startsWith('/members/profile/')) return 'Member Profile';
  if (pathname.startsWith('/super-admin/branches/')) return 'Branch Profile';
  if (pathname.startsWith('/super-admin/support/tickets/')) return 'Support Ticket';
  if (pathname === '/super-admin/support/tickets') return 'Support Hub';
  return ROUTE_LABELS[pathname] || 'Dashboard';
};

const Layout = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications, init: initNotifications } = useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  const routeLabel = getRouteLabel(location.pathname);

  // Initial fetch & realtime init
  useEffect(() => {
    fetchNotifications();
    initNotifications();
  }, [fetchNotifications, initNotifications]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Header shadow on scroll
  const handleScroll = useCallback((e) => {
    setIsScrolled(e.target.scrollTop > 10);
  }, []);

  // ── Mobile Gesture Support ──
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRightSwipe && !isMobileMenuOpen) setIsMobileMenuOpen(true);
    if (isLeftSwipe && isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <div 
      className="flex h-screen bg-obsidian overflow-hidden font-sans antialiased text-ivory"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >

      {/* ── Toaster: Aura-styled notifications ── */}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(20, 14, 10, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            color: '#fdfbf7',
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: '"Outfit", system-ui, sans-serif',
            letterSpacing: '0.01em',
            padding: '14px 18px',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
            maxWidth: '380px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0a0a0a' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' },
          },
          loading: {
            iconTheme: { primary: '#a0522d', secondary: '#0a0a0a' },
          },
        }}
      />

      {/* ── Sidebar: Mobile Drawer ── */}
      <Sidebar
        isMobile={true}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNotificationsClick={() => { setShowNotifications(true); setIsMobileMenuOpen(false); }}
        onSettingsClick={() => { setShowSettings(true); setIsMobileMenuOpen(false); }}
        onHelpClick={() => { setShowHelp(true); setIsMobileMenuOpen(false); }}
      />

      {/* ── Sidebar: Desktop Persistent ── */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar
          isMobile={false}
          onNotificationsClick={() => setShowNotifications(true)}
          onSettingsClick={() => setShowSettings(true)}
          onHelpClick={() => setShowHelp(true)}
        />
      </div>

      {/* ── Main Canvas ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top Intelligence Bar */}
        <header
          className={`
            h-16 lg:h-20 flex-shrink-0
            bg-[#080808]/90 backdrop-blur-2xl
            border-b px-5 lg:px-10
            flex items-center justify-between
            relative z-20 transition-all duration-300
            ${isScrolled
              ? 'border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]'
              : 'border-white/[0.04]'}
          `}
        >
          {/* Left: Page Identity, Breadcrumbs, and Workspace indicator */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden w-10 h-10 bg-earth-clay rounded-xl flex items-center justify-center shadow-lg shadow-earth-clay/20 touch-target"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="text-white" size={18} />
            </button>

            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline text-[16px] sm:text-[20px] font-black tracking-tight capitalize max-w-[140px] sm:max-w-none">
                {(() => {
                  const gymName = (user?.gym_name || 'FitXeno').toLowerCase();
                  const words = gymName.split(' ');
                  const firstWord = words[0];
                  const restWords = words.slice(1).join(' ');
                  
                  return (
                    <>
                      <span className="text-white truncate">{firstWord}</span>
                      {restWords && (
                        <span className="text-earth-clay ml-1 truncate">{restWords}</span>
                      )}
                    </>
                  );
                })()}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={routeLabel}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] sm:text-sm font-black text-ivory tracking-tight mt-1 leading-none"
                >
                  {routeLabel}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Right side aligned cluster holding all controls */}
          <div className="flex items-center gap-3.5 ml-auto">
            <div className="hidden lg:block">
              <OfflineSyncHub />
            </div>

            <div className="hidden md:block">
              <QuickSearch />
            </div>

            {/* Notification bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 bg-[#0c0c0c]/80 hover:bg-white/[0.06] border border-white/[0.08] hover:border-earth-clay/20 rounded-full flex items-center justify-center transition-all duration-300 text-slate-400 hover:text-earth-clay"
              aria-label="Notifications"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-earth-clay text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(160,82,45,0.8)] border border-[#080808]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar Toggle */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`
                  w-9 h-9 border rounded-full flex items-center justify-center transition-all duration-300 group overflow-hidden
                  ${showProfile 
                    ? 'bg-earth-clay border-earth-clay shadow-lg shadow-earth-clay/20' 
                    : 'bg-[#0c0c0c]/80 hover:bg-white/[0.06] border-white/[0.08] hover:border-earth-clay/20 text-slate-400 hover:text-earth-clay'
                  }
                `}
                title="Profile Hub"
              >
                <User size={14} className={showProfile ? 'text-white' : 'text-slate-400 group-hover:text-earth-clay transition-colors'} />
              </button>

              {/* ── Profile Hub Dropdown ── */}
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute top-[calc(100%+12px)] right-0 w-[min(300px,calc(100vw-2rem))] z-50 origin-top-right"
                  >
                    {/* Outer Glow & Border Container */}
                    <div className="relative w-full rounded-2xl bg-[#080808] border border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)] overflow-hidden">
                      
                      {/* Premium Top Light Sweep */}
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
                      
                      {/* Ambient Background Glow */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-earth-clay/20 blur-[50px] pointer-events-none rounded-full" />

                      {/* Content Wrapper */}
                      <div className="relative z-10 flex flex-col">
                        
                        {/* 1. Master Identity Block */}
                        <div className="p-5 flex items-center gap-4 border-b border-white/[0.04]">
                          {/* Rich Avatar Ring */}
                          <div className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-b from-earth-clay/50 to-transparent shadow-[0_0_20px_rgba(194,107,54,0.15)] flex-shrink-0">
                            <div className="w-full h-full rounded-full bg-[#111] border border-[#222] flex items-center justify-center">
                              <User size={20} className="text-earth-clay" />
                            </div>
                            {/* Online Dot */}
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111] shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                          </div>

                          <div className="flex flex-col flex-1 min-w-0">
                            <h3 className="text-[15px] font-bold text-white tracking-tight truncate leading-none mb-1.5 capitalize">
                              {getDisplayName(user)}
                            </h3>
                            <p className="text-[10px] font-bold text-earth-clay uppercase tracking-[0.1em]">
                              Branch Admin
                            </p>
                          </div>
                        </div>

                        {/* 2. Premium Data Readouts */}
                        <div className="p-3 flex flex-col gap-1">
                          <div className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05] transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                <MapPin size={12} />
                              </div>
                              <span className="text-[12px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Branch</span>
                            </div>
                            <span className="text-[13px] font-semibold text-white truncate max-w-[110px] text-right">
                              {user?.gym_name || 'FitXeno HQ'}
                            </span>
                          </div>

                          <div className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05] transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                <Shield size={12} />
                              </div>
                              <span className="text-[12px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Access ID</span>
                            </div>
                            <span className="text-[12px] font-mono font-medium text-slate-300 tracking-wider">
                              {user?.id?.substring(0, 8).toUpperCase() || 'SYS-01'}
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                        {/* 3. Action Block */}
                        <div className="p-3">
                          <button
                            onClick={() => {
                              setShowProfile(false);
                              logout();
                            }}
                            className="relative w-full h-11 rounded-xl bg-gradient-to-b from-[#1a1a1a] to-[#111] border border-white/[0.08] hover:border-earth-clay/40 transition-all duration-300 group overflow-hidden flex items-center justify-center gap-2.5"
                          >
                            <div className="absolute inset-0 bg-earth-clay/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <LogOut size={14} className="text-slate-400 group-hover:text-earth-clay relative z-10 transition-colors" />
                            <span className="text-[13px] font-semibold text-slate-300 group-hover:text-white relative z-10 transition-colors">
                              Secure Sign Out
                            </span>
                          </button>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── Dynamic Content Surface ── */}
        <div
          className="flex-1 overflow-y-auto premium-scrollbar p-5 lg:p-10 pb-28 lg:pb-10"
          onScroll={handleScroll}
        >
          <Outlet />
        </div>

        {/* ── Mobile Bottom Navigation ── */}
        <BottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
        <MobileActionFAB />

        {/* ── Intelligence Hub (Notifications) ── */}
        <NotificationHub
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* ── Settings Hub ── */}
        <SettingsHub
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* ── Support Hub ── */}
        <HelpHub
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />
      </main>
    </div>
  );
};

export default Layout;
