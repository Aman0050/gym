import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bell, CheckCheck, Trash2, 
  AlertCircle, Zap, UserPlus, CreditCard,
  LifeBuoy
} from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { transitions } from './ui/transitions';

const ICON_MAP = {
  PAYMENT_RECEIVED: CreditCard,
  MEMBER_ENROLLED:  UserPlus,
  SYSTEM_ALERT:     AlertCircle,
  PLAN_EXPIRY:      Zap,
  IN_APP:           LifeBuoy,
  DEFAULT:          Bell
};

const NotificationHub = ({ isOpen, onClose }) => {
  const { notifications, fetchNotifications, markAsRead, unreadCount, clearAll, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Auto-mark as read when opened
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={transitions.normal}
            className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#0a0a0a]/95 backdrop-blur-3xl border-l border-white/[0.08] z-[210] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-8 py-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Bell size={16} className="text-earth-clay" />
                  <h2 className="text-lg font-serif font-black text-ivory tracking-tight uppercase">
                    Intelligence Hub
                  </h2>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                  {unreadCount} Unread Notifications
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-500 hover:text-ivory hover:border-white/20 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto premium-scrollbar px-6 py-6 space-y-3">
              {notifications.length > 0 ? (
                (notifications || []).map((n) => {
                  const Icon = ICON_MAP[n.type] || ICON_MAP.DEFAULT;
                  const isHighPriority = n.message?.includes('Priority: HIGH') || n.message?.includes('Priority: CRITICAL');
                  const isCritical = n.message?.includes('Priority: CRITICAL');
                  
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        console.log("Notification Clicked", n);
                        if (!n.is_read) markAsRead(n.id);
                        if (n.action_url) {
                          console.log("Navigating to:", n.action_url);
                          navigate(n.action_url);
                          onClose();
                        }
                      }}
                      className={`
                        p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden cursor-pointer
                        ${n.is_read 
                          ? 'bg-white/[0.02] border-white/[0.04] opacity-70 hover:opacity-100 hover:bg-white/[0.04]' 
                          : isCritical
                            ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/60 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]'
                            : isHighPriority
                              ? 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/60 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]'
                              : 'bg-white/[0.06] border-white/[0.12] hover:border-earth-clay/50 shadow-[0_0_15px_-3px_rgba(160,82,45,0.2)]'
                        }
                      `}
                    >
                      {/* Unread Indicator */}
                      {!n.is_read && (
                        <div className={`absolute top-0 left-0 w-1 h-full ${isCritical ? 'bg-red-500' : isHighPriority ? 'bg-orange-500' : 'bg-earth-clay'} shadow-[0_0_8px_currentColor]`} />
                      )}

                      <div className="flex gap-4">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors
                          ${n.is_read 
                            ? 'bg-white/[0.04] border-white/[0.08] text-slate-500' 
                            : isCritical
                              ? 'bg-red-500/20 border-red-500/30 text-red-400'
                              : isHighPriority
                                ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                                : 'bg-earth-clay/15 border-earth-clay/20 text-earth-clay'
                          }
                        `}>
                          <Icon size={18} className={!n.is_read && isCritical ? "animate-pulse" : ""} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-[11px] font-black uppercase tracking-wider truncate ${
                              n.is_read ? 'text-slate-500' : isCritical ? 'text-red-400' : isHighPriority ? 'text-orange-400' : 'text-ivory'
                            }`}>
                              {n.title.replace('New Support Ticket:', 'Ticket:')}
                            </h4>
                            <span className={`text-[9px] font-bold whitespace-nowrap ${n.is_read ? 'text-slate-700' : 'text-slate-400'}`}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-xs font-medium leading-relaxed ${n.is_read ? 'text-slate-600' : 'text-slate-400'}`}>
                            {n.message}
                          </p>
                        </div>
                      </div>

                      {!n.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          className="absolute right-4 bottom-4 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-earth-clay/10 rounded-lg text-earth-clay hover:bg-earth-clay/20"
                          title="Mark as read"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                  <div className="w-20 h-20 bg-white/[0.05] rounded-[2.5rem] flex items-center justify-center mb-6">
                    <Bell size={32} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-500">No Notifications</p>
                  <p className="text-[10px] font-bold text-slate-700 mt-2">Intelligence hub is clear</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-6 border-t border-white/[0.05] flex gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white/[0.04] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-all shadow-inner"
                  >
                    <CheckCheck size={13} />
                    Mark Read
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                  Clear All
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationHub;
