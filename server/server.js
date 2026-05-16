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
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10kb' })); // Body limit for security
app.use(requestMonitor); // Custom Performance Monitor

// Rate Limiting Hub (DDoS & Brute-force protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // General APIs: 300 requests per 15m
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. High operational load detected.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Auth: 10 attempts per 15m (Brute-force protection)
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
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// 6. Operational Health Hub
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.query('SELECT 1');
    const redisStatus = require('./config/redis').status;
    
    res.status(200).json({ 
      status: 'healthy', 
      database: dbStatus ? 'connected' : 'disconnected',
      cache: redisStatus === 'ready' ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date() 
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

// 7. Error Handling (Observability Chain)
Sentry.setupExpressErrorHandler(app); // New Sentry Error Capturer (v8+)
app.use(errorHandler); // Centralized App Error Handler

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`System Operational on Node Hub: ${PORT}`);
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
