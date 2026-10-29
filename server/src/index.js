import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import connectDB, { checkDBHealth, disconnectDB, isDBConnected } from './config/db.js';
import { config } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestIdMiddleware, requestLogger, errorLogger } from './middleware/requestId.js';
import { initializeSocket, initializeRedisAdapter } from './socket/index.js';
import { disconnectRedis } from './config/redis.js';
import { apiLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import pushRoutes from './routes/pushRoutes.js';

connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.allowedOrigins || [config.clientUrl],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Redis adapter for horizontal scaling (async, non-blocking)
initializeRedisAdapter(io).catch(err => {
  console.error('Failed to initialize Redis adapter:', err.message);
});

app.set('trust proxy', 1);

// Request ID & Logging middleware (must be first)
app.use(requestIdMiddleware);
app.use(requestLogger);

/**
 * Content Security Policy Configuration
 * - Development: Allows Vite HMR (inline scripts, eval, websocket)
 * - Production: Strict policy, no inline scripts/eval
 */
const isDev = config.nodeEnv === 'development';
const allowedOrigins = config.allowedOrigins || [config.clientUrl];
const clientOrigin = allowedOrigins[0];

const cspDirectives = {
  defaultSrc: ["'self'"],
  // Scripts: Allow self + Vite HMR in dev
  scriptSrc: [
    "'self'",
    ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
  ],
  // Styles: Allow self + inline (needed for Tailwind, emotion, etc.)
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
  ],
  // Fonts: Allow self + data URIs + Google Fonts if used
  fontSrc: [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  // Images: Allow self + data URIs + blob + HTTPS
  imgSrc: [
    "'self'",
    'data:',
    'blob:',
    'https:',
  ],
  // Connect: API, WebSocket, Vite HMR
  connectSrc: [
    "'self'",
    ...allowedOrigins,
    ...(isDev ? ['ws:', 'wss:'] : []),
    // Allow WebSocket to same origin
    isDev ? 'ws://localhost:5173' : '',
    isDev ? 'ws://127.0.0.1:5173' : '',
  ].filter(Boolean),
  // Frames: Deny framing
  frameAncestors: ["'none'"],
  // Forms: Only to self
  formAction: ["'self'"],
  // Base URI: Only self
  baseUri: ["'self'"],
  // Object: Deny plugins
  objectSrc: ["'none'"],
  // Media: Self only
  mediaSrc: ["'self'"],
  // Manifest: Self only
  manifestSrc: ["'self'"],
  // Workers: Self + blob for Vite
  workerSrc: [
    "'self'",
    ...(isDev ? ['blob:'] : []),
  ],
  // Upgrade insecure requests in production
  ...(!isDev ? { upgradeInsecureRequests: [] } : {}),
};

// Helmet configuration with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
    reportOnly: isDev, // Report only in dev, enforce in prod
  },
  // Additional security headers
  crossOriginEmbedderPolicy: false, // Required for COOP/COEP if needed
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: !isDev ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies for refresh token

// Global API rate limiter (fallback for routes without specific limiters)
app.use('/api/', apiLimiter);

app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDBHealth();
  const redisHealthy = process.env.REDIS_HOST ? 'configured' : 'not configured';
  
  const healthy = dbHealth.healthy;
  const statusCode = healthy ? 200 : 503;
  
  res.status(statusCode).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
      redis: redisHealthy,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.get('/api/metrics', async (req, res) => {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
    },
    cpu: {
      user: cpu.user,
      system: cpu.system,
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: process.env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/push', pushRoutes);

app.use(notFound);
app.use(errorLogger); // Log errors with request context
app.use(errorHandler);

// Initialize Socket.IO with rate limiting
initializeSocket(io);

app.set('io', io);

httpServer.listen(config.port, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  if (isDev) {
    console.log('CSP: Report-only mode (development)');
  } else {
    console.log('CSP: Enforced mode (production)');
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close HTTP server (stops accepting new connections)
  httpServer.close(async () => {
    console.log('HTTP server closed');
    
    // Disconnect Redis
    await disconnectRedis();
    
    // Close MongoDB connection
    await disconnectDB();
    
    console.log('Graceful shutdown complete');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Don't exit immediately, let the request finish
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('UNCAUGHT_EXCEPTION');
});