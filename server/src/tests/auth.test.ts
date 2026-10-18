import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestApp, createAuthUser, expectSuccess, expectError, cleanupTestDB, teardownTestDB } from './utils';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { hashRefreshToken } from '../utils/tokens';

describe('Auth Routes', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  
  beforeAll(async () => {
    app = await createTestApp();
  });
  
  afterAll(async () => {
    await teardownTestDB();
  });
  
  beforeEach(async () => {
    await cleanupTestDB();
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      
      const response = await app
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      const data = expectSuccess(response, 201);
      expect(data.accessToken).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe(userData.name);
      expect(data.user.email).toBe(userData.email);
      expect(data.user.password).toBeUndefined();
      
      // Verify user exists in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(userData.name);
    });
    
    it('should reject registration with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };
      
      // First registration
      await app.post('/api/auth/register').send(userData);
      
      // Second registration with same email
      const response = await app
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expectError(response, 400, 'USER_ALREADY_EXISTS');
    });
    
    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      };
      
      const response = await app
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
    
    it('should reject registration with short password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
      };
      
      const response = await app
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
    
    it('should reject registration with missing fields', async () => {
      const response = await app
        .post('/api/auth/register')
        .send({})
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
  });
  
  describe('POST /api/auth/login', () => {
    let testUser: { user: any; accessToken: string; refreshToken: string; headers: any; cookies: any };
    
    beforeEach(async () => {
      testUser = await createAuthUser();
    });
    
    it('should login successfully with valid credentials', async () => {
      const response = await app
        .post('/api/auth/login')
        .send({
          email: testUser.user.email,
          password: 'password123',
        })
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.accessToken).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.user.email);
    });
    
    it('should reject login with invalid password', async () => {
      const response = await app
        .post('/api/auth/login')
        .send({
          email: testUser.user.email,
          password: 'wrongpassword',
        })
        .expect(401);
      
      expectError(response, 401, 'INVALID_CREDENTIALS');
    });
    
    it('should reject login with non-existent email', async () => {
      const response = await app
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
      
      expectError(response, 401, 'INVALID_CREDENTIALS');
    });
    
    it('should set refresh token cookie on login', async () => {
      const response = await app
        .post('/api/auth/login')
        .send({
          email: testUser.user.email,
          password: 'password123',
        })
        .expect(200);
      
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
    });
  });
  
  describe('POST /api/auth/refresh', () => {
    let testUser: { user: any; accessToken: string; refreshToken: string; headers: any; cookies: any };
    
    beforeEach(async () => {
      testUser = await createAuthUser();
    });
    
    it('should refresh access token with valid refresh token', async () => {
      const response = await app
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${testUser.refreshToken}`])
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.accessToken).toBeDefined();
      expect(data.accessToken).not.toBe(testUser.accessToken); // New token
      expect(data.user).toBeDefined();
    });
    
    it('should reject refresh without refresh token cookie', async () => {
      const response = await app
        .post('/api/auth/refresh')
        .expect(401);
      
      expectError(response, 401, 'TOKEN_INVALID');
    });
    
    it('should reject refresh with invalid refresh token', async () => {
      const response = await app
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token'])
        .expect(401);
      
      expectError(response, 401, 'TOKEN_INVALID');
    });
    
    it('should rotate refresh token on refresh', async () => {
      const response = await app
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${testUser.refreshToken}`])
        .expect(200);
      
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
      
      // Old refresh token should be revoked
      const oldToken = await RefreshToken.findOne({ 
        tokenHash: hashRefreshToken(testUser.refreshToken) 
      });
      expect(oldToken?.revoked).toBe(true);
    });
  });
  
  describe('GET /api/auth/me', () => {
    let testUser: { user: any; accessToken: string; refreshToken: string; headers: any; cookies: any };
    
    beforeEach(async () => {
      testUser = await createAuthUser();
    });
    
    it('should return current user profile with valid token', async () => {
      const response = await app
        .get('/api/auth/me')
        .set(testUser.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.user.email);
      expect(data.user.name).toBe(testUser.user.name);
      expect(data.user.password).toBeUndefined();
    });
    
    it('should reject request without token', async () => {
      const response = await app
        .get('/api/auth/me')
        .expect(401);
      
      expectError(response, 401, 'UNAUTHORIZED');
    });
    
    it('should reject request with invalid token', async () => {
      const response = await app
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expectError(response, 401, 'TOKEN_INVALID');
    });
  });
  
  describe('POST /api/auth/logout', () => {
    let testUser: { user: any; accessToken: string; refreshToken: string; headers: any; cookies: any };
    
    beforeEach(async () => {
      testUser = await createAuthUser();
    });
    
    it('should logout successfully and clear cookie', async () => {
      const response = await app
        .post('/api/auth/logout')
        .set(testUser.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.message).toBe('Logged out successfully');
      
      // Cookie should be cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.startsWith('refreshToken=') && c.includes('Max-Age=0'))).toBe(true);
    });
    
    it('should revoke refresh token in database', async () => {
      await app
        .post('/api/auth/logout')
        .set(testUser.headers)
        .expect(200);
      
      const token = await RefreshToken.findOne({
        tokenHash: hashRefreshToken(testUser.refreshToken)
      });
      expect(token?.revoked).toBe(true);
    });
  });
  
  describe('POST /api/auth/logout-all', () => {
    let testUser: { user: any; accessToken: string; refreshToken: string; headers: any; cookies: any };
    
    beforeEach(async () => {
      testUser = await createAuthUser();
      
      // Create additional refresh tokens for same user
      const { generateRefreshToken } = await import('../utils/tokens.js');
      
      for (let i = 0; i < 3; i++) {
        const refreshToken = generateRefreshToken();
        const refreshTokenHash = hashRefreshToken(refreshToken);
        await RefreshToken.create({
          user: testUser.user._id,
          tokenHash: refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    });
    
    it('should revoke all refresh tokens for user', async () => {
      const response = await app
        .post('/api/auth/logout-all')
        .set(testUser.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.message).toBe('Logged out from all devices successfully');
      
      // All tokens should be revoked
      const tokens = await RefreshToken.find({ user: testUser.user._id });
      expect(tokens.every(t => t.revoked)).toBe(true);
    });
  });
});