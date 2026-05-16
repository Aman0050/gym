import React, { useState, useEffect, useCallback } from 'react';
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
        onNotificationsClick={() => setShowNotifications(true)}
        onSettingsClick={() => setShowSettings(true)}
        onHelpClick={() => setShowHelp(true)}
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
            bg-obsidian/80 backdrop-blur-xl
            border-b px-5 lg:px-10
            flex items-center justify-between
            relative z-20 transition-all duration-300
            ${isScrolled
              ? 'border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]'
              : 'border-transparent'}
          `}
        >
          {/* Left: Mobile Menu + Route Label */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden w-10 h-10 bg-earth-clay rounded-xl flex items-center justify-center shadow-lg shadow-earth-clay/20 touch-target"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="text-white" size={18} />
            </button>

            <div className="hidden sm:flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                FitVibe
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={routeLabel}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-black text-ivory tracking-tight leading-none"
                >
                  {routeLabel}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Search + Notifications + User */}
          <div className="flex items-center gap-3 lg:gap-5 flex-1 justify-end">
            <div className="hidden md:block mr-4">
              <OfflineSyncHub />
            </div>
            <QuickSearch />

            {/* Notification bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative touch-target w-10 h-10 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl flex items-center justify-center transition-all text-slate-400 hover:text-earth-clay"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-earth-clay rounded-full shadow-[0_0_8px_rgba(160,82,45,0.8)]" />
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/[0.06] hidden sm:block" />

            {/* Profile Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`
                  touch-target w-10 h-10 border rounded-xl flex items-center justify-center transition-all group
                  ${showProfile 
                    ? 'bg-earth-clay border-earth-clay shadow-lg shadow-earth-clay/20' 
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.07] text-slate-400 hover:text-earth-clay'
                  }
                `}
                title="Profile Hub"
              >
                <User size={16} className={showProfile ? 'text-white' : 'text-slate-400 group-hover:text-earth-clay transition-colors'} />
              </button>

              {/* ── Profile Hub Dropdown ── */}
              <AnimatePresence>
                {showProfile && (
                  <>
                    {/* Backdrop for click-away */}
                    <div className="fixed inset-0 z-30" onClick={() => setShowProfile(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-14 right-0 w-72 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 shadow-2xl z-40 overflow-hidden"
                    >
                      {/* Decorative Background */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-earth-clay/10 blur-[40px] rounded-full pointer-events-none" />

                      {/* User Identity */}
                      <div className="relative flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-earth-clay mb-3 shadow-inner">
                          <User size={30} />
                        </div>
                        <h3 className="text-sm font-black text-ivory tracking-tight">{user?.name}</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          Branch Administrator
                        </p>
                      </div>

                      {/* Information Grid */}
                      <div className="space-y-3 mb-8">
                        <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center gap-3">
                          <MapPin size={12} className="text-earth-clay" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Gym Branch</p>
                            <p className="text-[10px] font-bold text-ivory truncate">{user?.gym_name || 'FitVibe HQ'}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center gap-3">
                          <Shield size={12} className="text-earth-clay" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Admin ID</p>
                            <p className="text-[10px] font-bold text-ivory truncate">
                              {user?.id?.substring(0, 12).toUpperCase()}...
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/20"
                      >
                        <LogOut size={14} />
                        Terminate Session
                      </button>
                    </motion.div>
                  </>
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
