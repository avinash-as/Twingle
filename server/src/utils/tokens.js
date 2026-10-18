import crypto from 'crypto';
import { config } from '../config/env.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Generate a secure random token
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate access token (short-lived: 15 minutes)
 */
export const generateAccessToken = (userId) => {
  // Using a simple JWT-like token for access (could use jsonwebtoken if preferred)
  const payload = {
    sub: userId,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  };
  
  // In production, use proper JWT signing
  // For now, we'll use a simple approach with the existing JWT secret
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${header}.${payloadB64}`)
    .digest('base64url');
  
  return `${header}.${payloadB64}.${signature}`;
};

/**
 * Generate refresh token (long-lived: 7 days)
 */
export const generateRefreshToken = () => {
  return generateSecureToken(64);
};

/**
 * Hash refresh token for storage (never store plain tokens)
 */
export const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  try {
    const [header, payload, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      throw new AppError(ERROR_CODES.TOKEN_INVALID, 'Invalid token signature', 401);
    }
    
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new AppError(ERROR_CODES.TOKEN_EXPIRED, 'Token expired', 401);
    }
    
    if (decoded.type !== 'access') {
      throw new AppError(ERROR_CODES.TOKEN_INVALID, 'Invalid token type', 401);
    }
    
    return { userId: decoded.sub };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(ERROR_CODES.TOKEN_INVALID, 'Invalid token', 401);
  }
};

/**
 * Cookie options for refresh token
 */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh', // Only sent to refresh endpoint
};

/**
 * Cookie options for access token (if needed for non-SPA clients)
 */
export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};