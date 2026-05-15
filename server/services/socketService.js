const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');

let io;

const initSocket = (server) => {
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(server, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true
    }
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

  eventBus.on('notification.created', (data) => {
    broadcastToGym(data.gymId, 'NEW_NOTIFICATION', data);
  });
};

const broadcastToGym = (gymId, eventName, data) => {
  if (io) {
    io.to(`gym_${gymId}`).emit(eventName, data);
    logger.info(`Broadcasted ${eventName} to gym_${gymId}`);
  }
};

module.exports = { initSocket, broadcastToGym };
