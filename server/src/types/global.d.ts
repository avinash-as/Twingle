// Global type declarations for the Twingle server

import { User } from '../models/User.js';

// Express namespace extensions
declare global {
  namespace Express {
    interface Request {
      /** Unique request ID for tracing */
      id: string;
      requestId: string;
      /** Authenticated user (set by protect middleware) */
      user?: User;
      /** Socket.IO instance (set by app.set('io', io)) */
      app: {
        get(key: 'io'): import('socket.io').Server;
        set(key: 'io', value: import('socket.io').Server): void;
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

// Module augmentation for Socket.IO
declare module 'socket.io' {
  interface Socket {
    /** Authenticated user ID */
    userId: string;
    /** Full user object */
    user: User;
  }
}

// Custom error codes
export type ErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'INVALID_CREDENTIALS'
  | 'VALIDATION_ERROR'
  | 'INVALID_ID'
  | 'USER_NOT_FOUND'
  | 'CONNECTION_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'CONNECTION_ALREADY_EXISTS'
  | 'ALREADY_CONNECTED'
  | 'CANNOT_CONNECT_SELF'
  | 'NOT_CONNECTED'
  | 'CONNECTION_ALREADY_PROCESSED'
  | 'NOT_AUTHORIZED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'SOCKET_ERROR';

// Socket event types
export interface SocketEvents {
  // Client -> Server
  update_location: { latitude: number; longitude: number };
  set_discoverable: boolean;
  send_connection_request: { receiverId: string };
  accept_connection: { connectionId: string };
  reject_connection: { connectionId: string };
  send_message: { receiverId: string; content: string };
  typing: { receiverId: string };
  stop_typing: { receiverId: string };
  mark_as_read: { receiverId: string };

  // Server -> Client
  user_online: { userId: string; name: string; avatar: string };
  user_offline: { userId: string };
  connection_request: { 
    connectionId: string; 
    sender: { id: string; name: string; avatar: string; bio: string } 
  };
  connection_accepted: { 
    connectionId: string; 
    receiver: { id: string; name: string; avatar: string; bio: string } 
  };
  connection_rejected: { connectionId: string };
  receive_message: Message;
  user_typing: { userId: string };
  user_stop_typing: { userId: string };
  messages_read: { userId: string };
  validation_error: { event: string; error: string };
  rate_limit_error: { event: string; retryAfter: number };
  connection_error: { code: ErrorCode; message: string };
  message_error: { code: ErrorCode; message: string };
  location_error: { message: string };
  discoverable_error: { message: string };
}

// Message type for socket events
export interface Message {
  _id: string;
  sender: string | { _id: string; name: string; avatar: string };
  receiver: string | { _id: string; name: string; avatar: string };
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    stack?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Pagination query params
export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    database: {
      healthy: boolean;
      state?: number;
      host?: string;
      name?: string;
      reason?: string;
    };
    redis: string;
  };
  uptime: number;
  memory: NodeJS.MemoryUsage;
}