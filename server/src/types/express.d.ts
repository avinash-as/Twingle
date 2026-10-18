// Express type extensions

import { User } from '../models/User.js';
import { Server as SocketIOServer } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      /** Unique request ID for tracing */
      id: string;
      requestId: string;
      /** Authenticated user (set by protect middleware) */
      user?: User;
      /** Socket.IO instance (set by app.set('io', io)) */
      app: Express.Application & {
        get(key: 'io'): SocketIOServer;
        set(key: 'io', value: SocketIOServer): void;
      };
    }

    interface Response {
      locals: {
        requestId: string;
        [key: string]: unknown;
      };
    }
  }
}

// Socket.IO socket extensions
declare module 'socket.io' {
  interface Socket {
    /** Authenticated user ID */
    userId: string;
    /** Full user object */
    user: User;
  }
}

export {};