import { io } from 'socket.io-client';
import { useSocketStore } from '../store/useSocketStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  socket = null;

  connect(forceToken = null) {
    const token = forceToken || localStorage.getItem('accessToken');
    if (!token || token === 'undefined' || token === 'null') {
      return; // Do not connect if no valid token
    }

    if (this.socket) {
      // If token changed, disconnect old socket and create new one
      if (this.socket.auth?.token !== token) {
        this.disconnect();
      } else {
        // Same token. Reconnect if disconnected.
        if (!this.socket.connected) {
          this.socket.connect();
        }
        return;
      }
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], // Force WebSocket for production stability
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying in production
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: false
    });

    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('Real-time connection established');
      useSocketStore.getState().setConnected(true);
    });

    this.socket.on('disconnect', (reason) => {
      useSocketStore.getState().setConnected(false);
      
      // Only toast on unexpected drops, not intentional auth disconnects or cleanup
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
        const token = localStorage.getItem('accessToken');
        if (token && token !== 'undefined' && token !== 'null') {
          // It's a genuine network issue, not an auth logout
          // Let's not spam toast on transport close if it happens constantly
          // toast.error('Real-time sync lost. Attempting to reconnect...', { id: 'socket-status', duration: Infinity });
        }
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
      useSocketStore.getState().setConnected(false);
      
      // If authentication error, it means token is invalid. 
      // Do NOT retry infinitely. Disconnect and wait for api.js to refresh token.
      if (err.message === 'Authentication error') {
        if (this.socket) {
          this.socket.io.opts.reconnection = false;
        }
        this.disconnect();
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
