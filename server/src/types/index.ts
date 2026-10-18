// Type exports for the server

export * from './global.js';
export * from './express.js';

import { Request, Response, NextFunction } from 'express';

// Import model types from declaration files
import type { UserDocument } from '../models/User.js';
import type { ConnectionDocument } from '../models/Connection.js';
import type { MessageDocument } from '../models/Message.js';
import type { RefreshTokenDocument } from '../models/RefreshToken.js';

// Re-export model types for convenience
export type User = UserDocument;
export type Connection = ConnectionDocument;
export type Message = MessageDocument;
export type RefreshToken = RefreshTokenDocument;

// Controller return types
export interface ControllerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Authenticated request type
export interface AuthRequest extends Request {
  user: User;
  id: string;
  requestId: string;
}

// Token pair type
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query parameter types
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface NearbyUsersQuery extends PaginationQuery {
  latitude: number;
  longitude: number;
  maxDistance?: number;
}

// Socket event payload types
export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
}

export interface SendConnectionRequestPayload {
  receiverId: string;
}

export interface ConnectionActionPayload {
  connectionId: string;
}

export interface SendMessagePayload {
  receiverId: string;
  content: string;
}

export interface TypingPayload {
  receiverId: string;
}

export interface MarkAsReadPayload {
  receiverId: string;
}

// Error response type
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

// Success response type
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;