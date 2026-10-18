// Environment variable type declarations

interface EnvConfig {
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // Database
  MONGODB_URI: string;
  MONGO_MAX_POOL_SIZE?: string;
  MONGO_MIN_POOL_SIZE?: string;
  MONGO_MAX_IDLE_TIME?: string;
  MONGO_SERVER_SELECTION_TIMEOUT?: string;
  MONGO_SOCKET_TIMEOUT?: string;
  MONGO_HEARTBEAT_FREQUENCY?: string;
  MONGO_TLS?: string;
  MONGO_TLS_ALLOW_INVALID?: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  
  // Client
  CLIENT_URL: string;
  
  // Redis (optional)
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
  REDIS_DB?: string;
  REDIS_URL?: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvConfig {}
  }
}

export {};