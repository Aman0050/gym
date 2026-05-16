import { create } from 'zustand';

export const useOfflineStore = create((set) => ({
  isOnline: navigator.onLine,
  setOnline: (status) => set({ isOnline: status }),
  
  // Track specific connectivity metrics
  lastConnected: new Date(),
  updateLastConnected: () => set({ lastConnected: new Date() }),
}));

// Listen for network changes globally
window.addEventListener('online', () => {
  useOfflineStore.getState().setOnline(true);
  useOfflineStore.getState().updateLastConnected();
});

window.addEventListener('offline', () => {
  useOfflineStore.getState().setOnline(false);
});
