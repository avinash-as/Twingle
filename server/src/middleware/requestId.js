import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 * Adds unique request ID to each request for tracing and debugging
 */

export const requestIdMiddleware = (req, res, next) => {
  // Get request ID from header or generate new one
  const requestId = req.headers['x-request-id'] || randomUUID();
  
  // Attach to request object
  req.id = requestId;
  req.requestId = requestId; // Alias for convenience
  
  // Add to response headers for client-side tracing
  res.setHeader('X-Request-ID', requestId);
  
  // Add to response locals for template access
  res.locals.requestId = requestId;
  
  next();
};

/**
 * Request logging middleware
 * Logs incoming requests with timing
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { requestId } = req;
  const { method, originalUrl, ip } = req;
  
  // Log request
  console.log(`[${requestId}] ${method} ${originalUrl} - ${ip}`);
  
  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    // Log response
    const logLevel = statusCode >= 400 ? 'warn' : 'info';
    console[logLevel](`[${requestId}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * Enhanced error logging with request context
 */
export const errorLogger = (err, req, res, next) => {
  const { requestId } = req;
  
  console.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id || 'unauthenticated',
  });
  
  next(err);
};

/**
 * Create child logger with request context
 * Usage: const logger = createRequestLogger(req);
 * logger.info('Processing payment', { amount: 100 });
 */
export const createRequestLogger = (req) => {
  const { requestId } = req;
  
  const prefix = `[${requestId}]`;
  
  return {
    info: (message, meta = {}) => console.info(`${prefix} ${message}`, meta),
    warn: (message, meta = {}) => console.warn(`${prefix} ${message}`, meta),
    error: (message, meta = {}) => console.error(`${prefix} ${message}`, meta),
    debug: (message, meta = {}) => console.debug(`${prefix} ${message}`, meta),
  };
};

export default requestIdMiddleware;