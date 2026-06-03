import api from './api';
import { useSyncStore } from '../store/useSyncStore';
import toast from 'react-hot-toast';

let isInitialized = false;

export const syncService = {
  /**
   * Main sync processor
   */
  sync: async () => {
    const store = useSyncStore.getState();
    if (store.queue.length === 0) return;

    toast.loading('Syncing offline data...', { id: 'sync-progress' });

    await store.processQueue(async (item) => {
      // Re-execute the failed API call
      const { method, url, data } = item;
      await api({ method, url, data, _isSync: true });
    });

    const finalStore = useSyncStore.getState();
    if (finalStore.queue.length === 0) {
      toast.success('Offline data synchronized!', { id: 'sync-progress' });
    } else {
      toast.error('Some items failed to sync.', { id: 'sync-progress' });
    }
  },

  /**
   * Monitor network status
   */
  init: () => {
    if (isInitialized) return;
    isInitialized = true;

    // 1. Initial Load
    useSyncStore.getState().init();

    // 2. Listen for Network Return
    window.addEventListener('online', () => {
      if (import.meta.env.DEV) console.log('[Sync] Back Online - Triggering Auto-Sync');
      syncService.sync();
    });

    // 3. Optional: Periodic check
    setInterval(() => {
      if (navigator.onLine) syncService.sync();
    }, 1000 * 60 * 5); // Every 5 mins
  }
};

