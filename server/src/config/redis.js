import Redis from 'ioredis';
import { config } from './env.js';

/**
 * Redis client configuration
 * Supports both single Redis and Redis Cluster/Sentinel
 */
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  // Connection options
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis: Max retries reached, giving up');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000);
  },
  reconnectOnError: (err) => {
    const targetErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];
    return targetErrors.some(e => err.message.includes(e));
  },
  enableReadyCheck: true,
  lazyConnect: true,
};

// Create publisher and subscriber clients
export const pubClient = new Redis(redisOptions);
export const subClient = new Redis(redisOptions);

// Event handlers
const setupClientEvents = (client, name) => {
  client.on('connect', () => console.log(`Redis ${name}: Connected`));
  client.on('ready', () => console.log(`Redis ${name}: Ready`));
  client.on('error', (err) => console.error(`Redis ${name} Error:`, err.message));
  client.on('close', () => console.log(`Redis ${name}: Connection closed`));
  client.on('reconnecting', () => console.log(`Redis ${name}: Reconnecting...`));
};

setupClientEvents(pubClient, 'Publisher');
setupClientEvents(subClient, 'Subscriber');

/**
 * Connect both clients (ioredis connects automatically unless lazyConnect)
 */
export const connectRedis = async () => {
  try {
    // With lazyConnect: true, we need to call connect()
    if (pubClient.status === 'wait') {
      await pubClient.connect();
    }
    if (subClient.status === 'wait') {
      await subClient.connect();
    }
    
    // Wait for ready state
    await Promise.all([
      new Promise((resolve, reject) => {
        if (pubClient.status === 'ready') return resolve();
        pubClient.once('ready', resolve);
        pubClient.once('error', reject);
      }),
      new Promise((resolve, reject) => {
        if (subClient.status === 'ready') return resolve();
        subClient.once('ready', resolve);
        subClient.once('error', reject);
      }),
    ]);
    
    console.log('Redis: Both clients connected successfully');
    return true;
  } catch (error) {
    console.error('Redis: Failed to connect:', error.message);
    return false;
  }
};

/**
 * Graceful disconnect
 */
export const disconnectRedis = async () => {
  try {
    await Promise.all([
      pubClient.quit(),
      subClient.quit(),
    ]);
    console.log('Redis: Disconnected gracefully');
  } catch (error) {
    console.error('Redis: Error during disconnect:', error.message);
  }
};

/**
 * Health check
 */
export const checkRedisHealth = async () => {
  try {
    const result = await pubClient.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
};

export default { pubClient, subClient, connectRedis, disconnectRedis, checkRedisHealth };