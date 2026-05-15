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
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Real-time connection established');
      useSocketStore.getState().setConnected(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Real-time connection lost:', reason);
      useSocketStore.getState().setConnected(false);
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
