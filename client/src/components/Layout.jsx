import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { Search, User, Menu, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Toaster } from 'react-hot-toast';

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
  const { unreadCount } = useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const routeLabel = getRouteLabel(location.pathname);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Header shadow on scroll
  const handleScroll = useCallback((e) => {
    setIsScrolled(e.target.scrollTop > 10);
  }, []);

  return (
    <div className="flex h-screen bg-obsidian overflow-hidden font-sans antialiased text-ivory">

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
        onSettingsClick={() => {}}
      />

      {/* ── Sidebar: Desktop Persistent ── */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar
          isMobile={false}
          onNotificationsClick={() => setShowNotifications(true)}
          onSettingsClick={() => {}}
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
          <div className="flex items-center gap-3 lg:gap-5">
            {/* Search */}
            <div className="hidden md:flex items-center bg-white/[0.04] border border-white/[0.07] px-4 py-2.5 rounded-xl gap-3 group focus-within:border-earth-clay/30 transition-all duration-300">
              <Search size={14} className="text-slate-600 group-focus-within:text-earth-clay transition-colors flex-shrink-0" />
              <input
                type="text"
                placeholder="Quick search..."
                className="bg-transparent border-none focus:ring-0 text-xs font-medium w-36 placeholder:text-slate-700 text-ivory outline-none"
              />
              <kbd className="text-[9px] text-slate-700 font-mono border border-white/[0.06] rounded px-1.5 py-0.5 hidden lg:block">⌘K</kbd>
            </div>

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

            {/* User info + logout */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-ivory leading-tight">{user?.name}</p>
                <p className="text-[9px] font-semibold text-earth-clay mt-0.5 uppercase tracking-wider">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={logout}
                className="touch-target w-10 h-10 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl flex items-center justify-center transition-all group"
                title="Sign out"
                aria-label="Sign out"
              >
                <User size={16} className="text-slate-400 group-hover:text-earth-clay transition-colors" />
              </button>
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
      </main>
    </div>
  );
};

export default Layout;
