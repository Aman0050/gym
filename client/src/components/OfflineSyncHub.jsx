import React, { useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStore } from '../store/useOfflineStore';
import { useSyncStore } from '../store/useSyncStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const OfflineSyncHub = () => {
  const { isOnline } = useOfflineStore();
  const { queue, isSyncing, processQueue, init } = useSyncStore();

  useEffect(() => { init(); }, []);

  // Automatic Sync when back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      const triggerSync = async () => {
        const toastId = toast.loading(`Syncing ${queue.length} pending actions...`, { id: 'sync-progress' });
        
        await processQueue(async (item) => {
          return api({
            method: item.method,
            url: item.url,
            data: item.data,
            _isSync: true // Prevent re-queueing
          });
        });

        toast.success('System synchronized successfully!', { id: 'sync-progress' });
      };
      
      triggerSync();
    }
  }, [isOnline, queue.length]);

  return (
    <div className="flex items-center gap-4">
      {/* Connectivity Status */}
      <AnimatePresence mode="wait">
        {!isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full"
          >
            <WifiOff size={12} className="text-red-400" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Offline Mode</span>
          </motion.div>
        ) : queue.length > 0 ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full"
          >
            <RefreshCw size={12} className={`text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              {isSyncing ? 'Synchronizing...' : `${queue.length} Pending Actions`}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="online"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full opacity-60"
          >
            <Wifi size={12} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Network Stable</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Queue Manager (Subtle) */}
      {queue.length > 0 && !isSyncing && (
        <button 
          onClick={() => {
            if (isOnline) processQueue(async (item) => api({...item, _isSync: true}));
            else toast.error('Connect to internet to sync data');
          }}
          className="text-[10px] font-black text-slate-500 hover:text-earth-clay uppercase tracking-[0.2em] transition-colors"
        >
          Force Sync
        </button>
      )}
    </div>
  );
};

export default OfflineSyncHub;
