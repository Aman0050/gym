const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');

let io;

const initSocket = (server) => {
  const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://gym-sooty-nine.vercel.app',
    process.env.CLIENT_URL,
    process.env.PRODUCTION_CLIENT_URL
  ].filter(Boolean);

  const { createAdapter } = require('@socket.io/redis-adapter');
  const redisConnection = require('../config/redis');
  
  // Create Redis clients for Pub/Sub (Scaling)
  const pubClient = redisConnection.duplicate();
  const subClient = redisConnection.duplicate();

  io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ["GET", "POST"],
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
    transports: ['websocket', 'polling'], // Allow polling as fallback but prioritize websocket
    allowEIO3: true, 
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware: Authenticate Socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    const gymId = socket.user.gym_id;
    const room = `gym_${gymId}`;
    
    socket.join(room);
    logger.info(`Socket Connected: User ${socket.user.id} joined room ${room}`);

    socket.on('disconnect', () => {
      logger.info(`Socket Disconnected: User ${socket.user.id}`);
    });
  });

  // Connect Event Bus to Sockets
  setupEventBusBridge();

  return io;
};

const setupEventBusBridge = () => {
  // Bridge: Internal Events -> Real-time Sockets
  
  eventBus.on(EVENTS.PAYMENT_SUCCESS, (data) => {
    broadcastToGym(data.gymId, 'REVENUE_UPDATE', data);
  });

  eventBus.on(EVENTS.ATTENDANCE_RECORDED, (data) => {
    broadcastToGym(data.gymId, 'ATTENDANCE_UPDATE', data);
  });

  eventBus.on(EVENTS.MEMBER_CREATED, (data) => {
    broadcastToGym(data.gymId, 'NEW_MEMBER', data);
  });

  // Multi-Admin Sync Events
  eventBus.on('member.updated', (data) => {
    broadcastToGym(data.gymId, 'MEMBER_SYNC', data);
  });

  eventBus.on('plan.updated', (data) => {
    broadcastToGym(data.gymId, 'PLAN_SYNC', data);
  });

  eventBus.on(EVENTS.GYM_SUSPENDED, (data) => {
    // 1. Alert the clients so they can show the suspension screen immediately
    broadcastToGym(data.gymId, 'GYM_LOCKOUT', {
      reason: data.reason,
      timestamp: new Date()
    });
    
    // 2. Terminate all connections for this gym after a short delay to allow the event to propagate
    setTimeout(() => {
      disconnectGym(data.gymId);
    }, 500);
  });
};

const disconnectGym = (gymId) => {
  if (io) {
    const room = `gym_${gymId}`;
    const sockets = io.sockets.adapter.rooms.get(room);
    if (sockets) {
      sockets.forEach((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
          logger.info(`Force disconnected socket ${socketId} due to gym suspension`);
        }
      });
    }
  }
};

const broadcastToGym = (gymId, eventName, data) => {
  if (io) {
    io.to(`gym_${gymId}`).emit(eventName, data);
    logger.info(`Broadcasted ${eventName} to gym_${gymId}`);
  }
};

module.exports = { initSocket, broadcastToGym, disconnectGym };
