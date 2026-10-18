import { AppError, ERROR_CODES, createErrorResponse, isOperationalError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  // Log error (in production, use proper logging service)
  console.error('Error:', {
    code: err.code,
    message: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    requestId: req.id,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(createErrorResponse(
      new AppError(ERROR_CODES.VALIDATION_ERROR, errors.join('; '), 400, errors)
    ));
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(createErrorResponse(
      new AppError(ERROR_CODES.INVALID_ID, 'Invalid resource ID format', 400)
    ));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json(createErrorResponse(
      new AppError(ERROR_CODES.USER_ALREADY_EXISTS, `${field} already exists`, 409)
    ));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(createErrorResponse(
      new AppError(ERROR_CODES.TOKEN_INVALID, 'Invalid token', 401)
    ));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(createErrorResponse(
      new AppError(ERROR_CODES.TOKEN_EXPIRED, 'Token expired', 401)
    ));
  }

  // AppError (our custom errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(createErrorResponse(err));
  }

  // Unknown/Programming errors - don't leak details in production
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev ? err.message : 'Internal Server Error';
  
  return res.status(500).json(createErrorResponse(
    new AppError(ERROR_CODES.INTERNAL_ERROR, message, 500, isDev ? err.stack : null)
  ));
};

export const notFound = (req, res, next) => {
  const error = new AppError(ERROR_CODES.USER_NOT_FOUND, `Route not found - ${req.originalUrl}`, 404);
  next(error);
};