import { create } from 'zustand';
import { get, set, del } from 'idb-keyval';

export const useSyncStore = create((setStore, getStore) => ({
  queue: [],
  isSyncing: false,

  // Initialize: Load queue from IndexedDB
  init: async () => {
    const persistedQueue = await get('offline-sync-queue') || [];
    setStore({ queue: persistedQueue });
  },

  // Add to Queue
  addToQueue: async (action) => {
    const newQueue = [...getStore().queue, { 
      ...action, 
      id: Date.now(), 
      timestamp: new Date() 
    }];
    setStore({ queue: newQueue });
    await set('offline-sync-queue', newQueue);
  },

  // Process Queue
  processQueue: async (processFn) => {
    const { queue, isSyncing } = getStore();
    if (isSyncing || queue.length === 0) return;

    setStore({ isSyncing: true });
    
    let currentQueue = [...queue];
    const failedItems = [];

    for (const item of currentQueue) {
      try {
        await processFn(item);
      } catch (err) {
        console.error('Sync failed for item:', item, err);
        failedItems.push(item);
      }
    }

    setStore({ queue: failedItems, isSyncing: false });
    await set('offline-sync-queue', failedItems);
  },

  clearQueue: async () => {
    setStore({ queue: [] });
    await del('offline-sync-queue');
  }
}));
