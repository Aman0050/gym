import { create } from 'zustand';

export const useSocketStore = create((set) => ({
  isConnected: false,
  lastEvent: null,
  activeRooms: [],

  setConnected: (status) => set({ isConnected: status }),
  
  setLastEvent: (event) => set({ lastEvent: event }),

  joinRoom: (room) => set((state) => ({ 
    activeRooms: [...new Set([...state.activeRooms, room])] 
  })),

  leaveRoom: (room) => set((state) => ({ 
    activeRooms: state.activeRooms.filter(r => r !== room) 
  })),
}));
