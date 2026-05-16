import { io } from 'socket.io-client';
import { useSocketStore } from '../store/useSocketStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  socket = null;

  connect(forceToken = null) {
    const token = forceToken || localStorage.getItem('token');
    if (!token) return;

    // Disconnect existing socket if token changed
    if (this.socket && this.socket.auth?.token !== token) {
      this.disconnect();
    }

    // Prevent multiple connections with same token
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], // Force WebSocket for production stability
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying in production
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Real-time connection established');
      useSocketStore.getState().setConnected(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Real-time connection lost:', reason);
      useSocketStore.getState().setConnected(false);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        toast.error('Real-time sync lost. Attempting to reconnect...', { id: 'socket-status', duration: Infinity });
      }
    });

    this.socket.on('reconnect', (attempt) => {
      toast.success('Real-time sync restored', { id: 'socket-status', duration: 3000 });
      useSocketStore.getState().setConnected(true);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      if (attempt > 1) {
        toast.loading(`Syncing... Attempt ${attempt}`, { id: 'socket-status' });
      }
    });

    this.socket.on('GYM_LOCKOUT', async (data) => {
      console.warn('CRITICAL: Tenant suspended. Locking session.');
      const { useAuthStore } = await import('../store/useAuthStore');
      useAuthStore.getState().setSuspended({ 
        reason: data.reason, 
        timestamp: data.timestamp 
      });
      this.disconnect();
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection failed:', err.message);
      useSocketStore.getState().setConnected(false);
      
      // If authentication error, it might be due to expired token
      if (err.message === 'Authentication error') {
        console.log('Refreshing socket connection...');
        // The api interceptor might be refreshing the token right now
        // We'll retry once after a delay
        setTimeout(() => this.connect(), 2000);
      }
    });
  }

  on(event, callback) {
    if (!this.socket) this.connect();
    this.socket.on(event, callback);
  }

  off(event) {
    if (this.socket) this.socket.off(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socket = new SocketService();
export default socket;
