require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");
const db = require('./config/db');
const socketService = require('./services/socketService');
const { errorHandler } = require('./middlewares/errorMiddleware');
const { requestMonitor } = require('./middlewares/monitorMiddleware');
const logger = require('./utils/logger');
// Environment Validation & Production Defaults
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`CRITICAL ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'https://gym-sooty-nine.vercel.app',
  process.env.CLIENT_URL,
  process.env.PRODUCTION_CLIENT_URL
].filter(Boolean);

// Background systems imports
const initializeCron = require('./utils/cronJobs');

const app = express();
const server = http.createServer(app);

// 0. Production Proxy & Trust Settings
if (isProduction) {
  app.set('trust proxy', 1); // Essential for Render/Vercel load balancers
}

// 1. Initialize Sentry (DevOps Primary)
Sentry.init({
  dsn: process.env.SENTRY_BACKEND_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// 2. Initialize Socket.io
socketService.initSocket(server);

// 3. Initialize Background Systems
const initEvents = require('./events');
initEvents();
initializeCron();

// 4. Middlewares & Production Optimization
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://browser.sentry-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS, "https://sentry.io", "wss://gym-fit-wvoy.onrender.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
})); 

app.use(compression());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
    if (isLocalhost || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' })); // Body limit for security
app.use(requestMonitor); // Custom Performance Monitor

// Rate Limiting Hub (Redis-Backed with local memory fallback)
const { RedisStore } = require('rate-limit-redis');
const redisConnection = require('./config/redis');

// Middleware to pre-parse JWT properties for rate limiting before token verification runs
const parseRateLimitKeys = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      if (decoded) {
        req.limiterUser = {
          id: decoded.id,
          gym_id: decoded.gym_id
        };
      }
    } catch (err) {
      // Fail silent
    }
  }
  next();
};

app.use(parseRateLimitKeys);

const getLimiterStore = (prefix) => {
  return new RedisStore({
    sendCommand: async (...args) => {
      if (redisConnection.status !== 'ready') {
        // Fallback gracefully instead of throwing an error that crashes nodemon
        return;
      }
      return await redisConnection.call(...args);
    },
    prefix: `rl:${prefix}:`,
  });
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // API: 1000 requests per 15m
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: getLimiterStore('api'),
  validate: false,
  keyGenerator: (req) => {
    if (req.limiterUser) {
      if (req.limiterUser.gym_id) {
        return `${req.limiterUser.gym_id}:${req.limiterUser.id || 'anon'}`;
      }
      if (req.limiterUser.id) {
        return `${req.limiterUser.id}`;
      }
    }
    return req.ip;
  },
  message: { error: 'Too many requests. High operational load detected.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Auth: 30 attempts per 15m per account/IP (NAT-friendly Brute-force protection)
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: getLimiterStore('auth'),
  validate: false,
  keyGenerator: (req) => {
    const identifier = req.body?.phone || req.body?.email || req.body?.identifier || 'anon';
    return `${req.ip}:${identifier}`;
  },
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 5. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/gyms', require('./routes/gymRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/demo', require('./routes/demoRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/admin/backups', require('./routes/backupRoutes'));
app.use('/api/admin/exports', require('./routes/exportRoutes'));


// 6. Operational Health Hub
app.get(['/health', '/api/health'], async (req, res) => {
  try {
    const dbStatus = await db.query('SELECT 1');
    const redisStatus = require('./config/redis').status;
    
    res.status(200).json({ 
      status: 'healthy', 
      database: dbStatus ? 'connected' : 'disconnected',
      cache: redisStatus === 'ready' ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date(),
      dbDiagnostics: {
        totalCount: db.pool.totalCount,
        idleCount: db.pool.idleCount,
        waitingCount: db.pool.waitingCount
      }
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: err.message,
      dbDiagnostics: db.pool ? {
        totalCount: db.pool.totalCount,
        idleCount: db.pool.idleCount,
        waitingCount: db.pool.waitingCount
      } : null
    });
  }
});

// 7. Error Handling (Observability Chain)
Sentry.setupExpressErrorHandler(app); // New Sentry Error Capturer (v8+)
app.use(errorHandler); // Centralized App Error Handler

// Global Rejection/Exception Safety Net
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`System Operational on Node Hub: ${PORT}`);
  if (process.send) {
    process.send('ready');
  }
});

// 8. Graceful Shutdown (Production Reliability)
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
    process.exit(0);
  });
});
