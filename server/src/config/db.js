import mongoose from 'mongoose';
import { config } from './env.js';

/**
 * MongoDB Connection Configuration
 * Optimized for production workloads with proper pooling and monitoring
 */

// Connection pool settings
const POOL_SETTINGS = {
  // Maximum number of sockets in the pool
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10),
  // Minimum number of sockets in the pool
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '2', 10),
  // Maximum time (ms) to wait for a connection from the pool
  maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME || '30000', 10),
  // Maximum time (ms) a socket can be idle before being closed
  maxConnecting: parseInt(process.env.MONGO_MAX_CONNECTING || '2', 10),
};

// Timeout settings
const TIMEOUT_SETTINGS = {
  // Server selection timeout (ms)
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000', 10),
  // Socket timeout (ms) - how long to wait for a response
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
  // Connection timeout (ms)
  connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT || '10000', 10),
  // Heartbeat frequency (ms)
  heartbeatFrequencyMS: parseInt(process.env.MONGO_HEARTBEAT_FREQUENCY || '10000', 10),
};

// Retry settings
const RETRY_SETTINGS = {
  // Retry writes on network errors
  retryWrites: true,
  // Retry reads on network errors
  retryReads: true,
};

// TLS/SSL settings (for Atlas/production)
const TLS_SETTINGS = process.env.MONGO_TLS === 'true' ? {
  tls: true,
  tlsAllowInvalidCertificates: process.env.MONGO_TLS_ALLOW_INVALID === 'true',
  tlsAllowInvalidHostnames: process.env.MONGO_TLS_ALLOW_INVALID === 'true',
} : {};

// Build connection options
const buildConnectionOptions = () => ({
  // Pool settings
  ...POOL_SETTINGS,
  // Timeout settings
  ...TIMEOUT_SETTINGS,
  // Retry settings
  ...RETRY_SETTINGS,
  // TLS settings
  ...TLS_SETTINGS,
  // Other settings
  maxIdleTimeMS: POOL_SETTINGS.maxIdleTimeMS,
  // Auto-create indexes (disable in production for performance)
  autoIndex: true,
  // Buffer commands when disconnected (default: true)
  bufferCommands: true,
  // bufferMaxEntries is deprecated in MongoDB driver 4.0+
  // Use new URL parser
  // useNewUrlParser: true, // Default in Mongoose 6+
  // useUnifiedTopology: true, // Default in Mongoose 6+
});

let isConnected = false;
let connectionPromise = null;
let lastMongoError = null;

/**
 * Connect to MongoDB with proper configuration
 */
const connectDB = async () => {
  // Return existing connection promise if already connecting
  if (connectionPromise) {
    return connectionPromise;
  }

  // Return existing connection if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB: Already connected');
    return mongoose.connection;
  }

  const options = buildConnectionOptions();
  const uri = config.mongodbUri;

  console.log('MongoDB: Connecting...', {
    host: new URL(uri).hostname,
    poolSize: POOL_SETTINGS.maxPoolSize,
    env: config.nodeEnv,
  });

  connectionPromise = (async () => {
    try {
      // Set up event listeners BEFORE connecting
      setupEventListeners();

      const conn = await mongoose.connect(uri, options);
      
      // Repair legacy invalid geo data so 2dsphere indexes can be created
      try {
        const users = conn.connection.db.collection('users');
        await users.updateMany({ 'locationGeo.coordinates': { $exists: false } }, { $unset: { locationGeo: '' } });
        await users.updateMany({ 'locationGeo.coordinates': { $size: 0 } }, { $unset: { locationGeo: '' } });
      } catch (e) {
        console.warn('MongoDB: geo data cleanup skipped:', e.message);
      }

      isConnected = true;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`MongoDB: Pool size ${conn.connections.length}/${POOL_SETTINGS.maxPoolSize}`);
      
      return conn;
    } catch (error) {
      isConnected = false;
      connectionPromise = null;
      lastMongoError = error.message;
      console.error('MongoDB Connection Error:', error.message);
      setTimeout(() => {
        connectDB().catch((retryError) => {
          console.error('MongoDB retry failed:', retryError.message);
        });
      }, 5000);
      throw error;
    }
  })();

  return connectionPromise;
};

/**
 * Set up Mongoose connection event listeners
 */
const setupEventListeners = () => {
  const db = mongoose.connection;

  // Remove existing listeners to avoid duplicates
  db.removeAllListeners('connected');
  db.removeAllListeners('disconnected');
  db.removeAllListeners('error');
  db.removeAllListeners('reconnected');
  db.removeAllListeners('reconnectFailed');
  db.removeAllListeners('close');
  db.removeAllListeners('fullsetup');
  db.removeAllListeners('all');
  db.removeAllListeners('open');
  db.removeAllListeners('connected');
  db.removeAllListeners('disconnecting');

  // Connection events
  db.on('connected', () => {
    isConnected = true;
    console.log('MongoDB: Connected');
  });

  db.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB: Disconnected');
  });

  db.on('error', (error) => {
    console.error('MongoDB: Connection error:', error.message);
  });

  db.on('reconnected', () => {
    isConnected = true;
    console.log('MongoDB: Reconnected');
  });

  db.on('reconnectFailed', () => {
    isConnected = false;
    console.error('MongoDB: Reconnect failed - giving up');
  });

  db.on('close', () => {
    isConnected = false;
    console.log('MongoDB: Connection closed');
  });

  db.on('fullsetup', () => {
    console.log('MongoDB: Full setup complete (all servers connected)');
  });

  db.on('open', () => {
    console.log('MongoDB: Connection open');
  });

  // Monitor pool statistics periodically (in production)
  if (config.nodeEnv === 'production') {
    setInterval(() => {
      logPoolStats();
    }, 60000); // Every minute
  }
};

/**
 * Log connection pool statistics
 */
const logPoolStats = () => {
  const db = mongoose.connection;
  if (db.readyState !== 1) return;

  try {
    // Access the underlying driver's pool
    const pool = db.client?.s?.pool;
    if (pool) {
      console.log('MongoDB Pool Stats:', {
        total: pool.size,
        available: pool.available,
        pending: pool.pending,
        checkedOut: pool.size - pool.available,
        maxPoolSize: POOL_SETTINGS.maxPoolSize,
      });

      // Warn if pool is near capacity
      const utilization = (pool.size - pool.available) / POOL_SETTINGS.maxPoolSize;
      if (utilization > 0.8) {
        console.warn(`MongoDB: High pool utilization (${(utilization * 100).toFixed(1)}%)`);
      }
    }
  } catch (error) {
    // Pool stats not available in all driver versions
  }
};

/**
 * Health check for MongoDB connection
 */
export const checkDBHealth = async () => {
  try {
    if (!isConnected || mongoose.connection.readyState !== 1) {
      // Try to (re)establish the connection lazily.
      connectDB().catch(() => {});
      return { healthy: false, reason: lastMongoError || 'Not connected' };
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return {
      healthy: true,
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  } catch (error) {
    return { healthy: false, reason: error.message };
  }
};

/**
 * Get connection statistics
 */
export const getDBStats = async () => {
  try {
    if (!isConnected) {
      return { connected: false };
    }

    const db = mongoose.connection;
    const stats = await db.db.stats();
    
    return {
      connected: true,
      state: db.readyState,
      host: db.host,
      name: db.name,
      collections: stats.collections,
      objects: stats.objects,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
    };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

/**
 * Graceful disconnect
 */
export const disconnectDB = async () => {
  try {
    if (isConnected) {
      await mongoose.connection.close();
      isConnected = false;
      connectionPromise = null;
      console.log('MongoDB: Disconnected gracefully');
    }
  } catch (error) {
    console.error('MongoDB: Error during disconnect:', error.message);
  }
};

/**
 * Check if connected
 */
export const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Get connection ready state
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */
export const getReadyState = () => {
  return mongoose.connection.readyState;
};

export default connectDB;