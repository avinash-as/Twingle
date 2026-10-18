import { config } from '../config/env.js';
import User from '../models/User.js';
import * as connectionHandler from './handlers/connectionHandler.js';
import * as messageHandler from './handlers/messageHandler.js';
import { validateSocketEvent } from '../middleware/validation.js';
import { socketEvents } from '../validations/schemas.js';
import { socketEventLimiter } from '../middleware/rateLimiter.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { AppError } from '../utils/errors.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient, connectRedis } from '../config/redis.js';

/**
 * Wrapper to validate socket event data before passing to handler
 */
const validatedHandler = (schema, handler) => (io, socket, userId, data) => {
  const validation = validateSocketEvent(schema)(data);
  if (!validation.success) {
    socket.emit('validation_error', { event: schema.name || 'unknown', error: validation.error });
    return;
  }
  return handler(io, socket, userId, validation.data);
};

/**
 * Wrapper to add rate limiting to socket events
 */
const rateLimitedHandler = (eventName, maxPerMinute, handler) => (io, socket, userId, data) => {
  const limiter = socketEventLimiter(eventName, maxPerMinute);
  return new Promise((resolve, reject) => {
    limiter(socket, (err) => {
      if (err) {
        if (err.message.startsWith('RATE_LIMITED:')) {
          const [, event, retryAfter] = err.message.split(':');
          socket.emit('rate_limit_error', { event, retryAfter: parseInt(retryAfter) });
          return resolve();
        }
        return reject(err);
      }
      resolve(handler(io, socket, userId, data));
    });
  });
};

/**
 * Initialize Redis adapter for multi-instance scaling
 */
export const initializeRedisAdapter = async (io) => {
  // Only use Redis adapter if Redis is configured
  if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
    console.log('Socket.IO: Running in single-instance mode (no Redis configured)');
    return false;
  }

  try {
    const connected = await connectRedis();
    if (!connected) {
      console.warn('Socket.IO: Redis connection failed, falling back to single-instance mode');
      return false;
    }

    // Create and attach Redis adapter
    const adapter = createAdapter(pubClient, subClient);
    io.adapter(adapter);
    
    console.log('Socket.IO: Redis adapter enabled - multi-instance mode active');
    return true;
  } catch (error) {
    console.error('Socket.IO: Failed to initialize Redis adapter:', error.message);
    console.warn('Socket.IO: Falling back to single-instance mode');
    return false;
  }
};

/**
 * Get all connected sockets across all instances
 * Only works with Redis adapter
 */
export const getAllConnectedSockets = async (io) => {
  try {
    return await io.fetchSockets();
  } catch (error) {
    console.error('Error fetching sockets:', error);
    return [];
  }
};

/**
 * Emit to specific user across all instances
 * Uses Redis adapter to find user's socket
 */
export const emitToUser = (io, userId, event, data) => {
  io.to(userId).emit(event, data);
};

/**
 * Emit to room across all instances
 */
export const emitToRoom = (io, room, event, data) => {
  io.to(room).emit(event, data);
};

/**
 * Get socket count across all instances
 */
export const getSocketCount = async (io) => {
  try {
    const sockets = await io.fetchSockets();
    return sockets.length;
  } catch {
    return io.engine.clientsCount; // Fallback for single instance
  }
};

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(new Error(error.message));
      }
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${socket.user.name} (${userId})`);

    await connectionHandler.handleUserOnline(io, socket, userId);

    // Location & discoverability: 10/min
    socket.on('update_location', (data) => {
      rateLimitedHandler('update_location', 10, validatedHandler(socketEvents.update_location, connectionHandler.handleUpdateLocation))(io, socket, userId, data);
    });

    socket.on('set_discoverable', (data) => {
      rateLimitedHandler('set_discoverable', 10, validatedHandler(socketEvents.set_discoverable, connectionHandler.handleSetDiscoverable))(io, socket, userId, data);
    });

    // Connection requests: 20/min
    socket.on('send_connection_request', (data) => {
      rateLimitedHandler('send_connection_request', 20, validatedHandler(socketEvents.send_connection_request, connectionHandler.handleSendConnectionRequest))(io, socket, userId, data);
    });

    socket.on('accept_connection', (data) => {
      rateLimitedHandler('accept_connection', 20, validatedHandler(socketEvents.accept_connection, connectionHandler.handleAcceptConnection))(io, socket, userId, data);
    });

    socket.on('reject_connection', (data) => {
      rateLimitedHandler('reject_connection', 20, validatedHandler(socketEvents.reject_connection, connectionHandler.handleRejectConnection))(io, socket, userId, data);
    });

    // Messages: 30/min
    socket.on('send_message', (data) => {
      rateLimitedHandler('send_message', 30, validatedHandler(socketEvents.send_message, messageHandler.handleSendMessage))(io, socket, userId, data);
    });

    // Typing indicators: 60/min (more lenient)
    socket.on('typing', (data) => {
      rateLimitedHandler('typing', 60, validatedHandler(socketEvents.typing, messageHandler.handleTyping))(io, socket, userId, data);
    });

    socket.on('stop_typing', (data) => {
      rateLimitedHandler('stop_typing', 60, validatedHandler(socketEvents.stop_typing, messageHandler.handleStopTyping))(io, socket, userId, data);
    });

    // Read receipts: 30/min
    socket.on('mark_as_read', (data) => {
      rateLimitedHandler('mark_as_read', 30, validatedHandler(socketEvents.mark_as_read, messageHandler.handleMarkAsRead))(io, socket, userId, data);
    });

    socket.on('disconnect', async (reason) => {
      console.log(`User disconnected: ${socket.user.name} (${reason})`);
      await connectionHandler.handleDisconnect(io, socket);
    });
  });
};