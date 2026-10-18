import request, { TestAgent } from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { generateAccessToken, hashRefreshToken } from '../utils/tokens';
import { createTestUser, getAuthHeaders, clearTestDB, teardownTestDB } from '../jest.setup';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';

/**
 * Create a test Express app with all middleware and routes
 * Returns a supertest agent for making requests
 */
export const createTestApp = async (): Promise<TestAgent> => {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Import routes
  const { default: authRoutes } = await import('../routes/authRoutes.js');
  const { default: userRoutes } = await import('../routes/userRoutes.js');
  const { default: connectionRoutes } = await import('../routes/connectionRoutes.js');
  const { default: messageRoutes } = await import('../routes/messageRoutes.js');
  const { errorHandler, notFound } = await import('../middleware/errorHandler.js');
  const { requestIdMiddleware, requestLogger } = await import('../middleware/requestId.js');
  
  // Middleware
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  
  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/connections', connectionRoutes);
  app.use('/api/messages', messageRoutes);
  
  // Error handling
  app.use(notFound);
  app.use(errorHandler);
  
  // Return supertest agent
  return request(app);
};

/**
 * Create test user and return auth headers
 */
export const createAuthUser = async (overrides = {}) => {
  const user = await createTestUser(overrides);
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = 'test-refresh-token';
  const refreshTokenHash = hashRefreshToken(refreshToken);
  
  await RefreshToken.create({
    user: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  return {
    user,
    accessToken,
    refreshToken,
    headers: getAuthHeaders(accessToken),
    cookies: { refreshToken },
  };
};

/**
 * Create second test user for connection/message tests
 */
export const createSecondAuthUser = async (overrides = {}) => {
  const user = await createTestUser({ email: `test2-${Date.now()}@example.com`, ...overrides });
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = 'test-refresh-token-2';
  const refreshTokenHash = hashRefreshToken(refreshToken);
  
  await RefreshToken.create({
    user: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  return {
    user,
    accessToken,
    refreshToken,
    headers: getAuthHeaders(accessToken),
    cookies: { refreshToken },
  };
};

/**
 * Create third test user for message tests
 */
export const createThirdAuthUser = async (overrides = {}) => {
  const user = await createTestUser({ email: `test3-${Date.now()}@example.com`, ...overrides });
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = 'test-refresh-token-3';
  const refreshTokenHash = hashRefreshToken(refreshToken);
  
  await RefreshToken.create({
    user: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  return {
    user,
    accessToken,
    refreshToken,
    headers: getAuthHeaders(accessToken),
    cookies: { refreshToken },
  };
};

/**
 * Create accepted connection between two users
 */
export const createAcceptedConnection = async (userId1: string, userId2: string) => {
  const { Connection } = await import('../models/Connection.js');
  return Connection.create({
    sender: userId1,
    receiver: userId2,
    status: 'accepted',
  });
};

/**
 * Create pending connection request
 */
export const createPendingConnection = async (senderId: string, receiverId: string) => {
  const { Connection } = await import('../models/Connection.js');
  return Connection.create({
    sender: senderId,
    receiver: receiverId,
    status: 'pending',
  });
};

/**
 * Clean up test database
 */
export const cleanupTestDB = async () => {
  await clearTestDB();
};

/**
 * Assert successful response
 */
export const expectSuccess = (response: request.Response, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  return response.body.data;
};

/**
 * Assert error response
 */
export const expectError = (response: request.Response, statusCode: number, errorCode?: string) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBeDefined();
  if (errorCode) {
    expect(response.body.error.code).toBe(errorCode);
  }
  return response.body.error;
};

/**
 * Wait for async operations
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export { request, teardownTestDB };