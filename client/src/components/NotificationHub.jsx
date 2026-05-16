import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bell, CheckCheck, Trash2, 
  AlertCircle, Zap, UserPlus, CreditCard 
} from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { transitions } from './ui';

const ICON_MAP = {
  PAYMENT_RECEIVED: CreditCard,
  MEMBER_ENROLLED:  UserPlus,
  SYSTEM_ALERT:     AlertCircle,
  PLAN_EXPIRY:      Zap,
  DEFAULT:          Bell
};

const NotificationHub = ({ isOpen, onClose }) => {
  const { notifications, fetchNotifications, markAsRead, unreadCount, clearAll } = useNotificationStore();

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

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
                notifications.map((n) => {
                  const Icon = ICON_MAP[n.type] || ICON_MAP.DEFAULT;
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        p-5 rounded-2xl border transition-all duration-300 relative group
                        ${n.is_read 
                          ? 'bg-white/[0.02] border-white/[0.04] opacity-60' 
                          : 'bg-white/[0.05] border-white/[0.08] hover:border-earth-clay/30'
                        }
                      `}
                    >
                      <div className="flex gap-4">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border
                          ${n.is_read 
                            ? 'bg-white/[0.04] border-white/[0.08] text-slate-600' 
                            : 'bg-earth-clay/10 border-earth-clay/20 text-earth-clay'
                          }
                        `}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-[11px] font-black uppercase tracking-wider truncate ${n.is_read ? 'text-slate-500' : 'text-ivory'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[9px] font-bold text-slate-700 whitespace-nowrap">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>

                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
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
