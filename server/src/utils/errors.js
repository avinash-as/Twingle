/**
 * Standardized application error class
 */
export class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Distinguishes operational vs programming errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes for consistent error handling
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_ID: 'INVALID_ID',
  
  // Resources
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CONNECTION_NOT_FOUND: 'CONNECTION_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  
  // Business Logic
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  CONNECTION_ALREADY_EXISTS: 'CONNECTION_ALREADY_EXISTS',
  ALREADY_CONNECTED: 'ALREADY_CONNECTED',
  CANNOT_CONNECT_SELF: 'CANNOT_CONNECT_SELF',
  NOT_CONNECTED: 'NOT_CONNECTED',
  CONNECTION_ALREADY_PROCESSED: 'CONNECTION_ALREADY_PROCESSED',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  
  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SOCKET_ERROR: 'SOCKET_ERROR',
};

/**
 * Create standardized error responses
 */
export const createErrorResponse = (error, includeDetails = false) => {
  const response = {
    success: false,
    error: {
      code: error.code || ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'An unexpected error occurred',
    },
  };
  
  if (includeDetails && error.details) {
    response.error.details = error.details;
  }
  
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack;
  }
  
  return response;
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Check if error is operational (expected) vs programming error
 */
export const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};