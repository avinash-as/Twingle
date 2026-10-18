import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestApp, createAuthUser, createSecondAuthUser, createAcceptedConnection, expectSuccess, expectError, cleanupTestDB, teardownTestDB } from './utils';
import Connection from '../models/Connection';

describe('Connection Routes', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  let user1: { user: any; accessToken: string; headers: any };
  let user2: { user: any; accessToken: string; headers: any };
  
  beforeAll(async () => {
    app = await createTestApp();
  });
  
  afterAll(async () => {
    await teardownTestDB();
  });
  
  beforeEach(async () => {
    await cleanupTestDB();
    user1 = await createAuthUser();
    user2 = await createSecondAuthUser();
  });
  
  describe('POST /api/connections/connect', () => {
    it('should send connection request successfully', async () => {
      const response = await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() })
        .expect(201);
      
      const data = expectSuccess(response, 201);
      expect(data.connectionId).toBeDefined();
      expect(data.message).toBe('Connection request sent');
      
      // Verify connection exists in database
      const connection = await Connection.findById(data.connectionId);
      expect(connection).toBeTruthy();
      expect(connection?.sender.toString()).toBe(user1.user._id.toString());
      expect(connection?.receiver.toString()).toBe(user2.user._id.toString());
      expect(connection?.status).toBe('pending');
    });
    
    it('should reject connection to self', async () => {
      const response = await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user1.user._id.toString() })
        .expect(400);
      
      expectError(response, 400, 'CANNOT_CONNECT_SELF');
    });
    
    it('should reject connection to non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: fakeId })
        .expect(404);
      
      expectError(response, 404, 'USER_NOT_FOUND');
    });
    
    it('should reject duplicate pending request', async () => {
      // First request
      await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() })
        .expect(201);
      
      // Second request
      const response = await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() })
        .expect(400);
      
      expectError(response, 400, 'CONNECTION_ALREADY_EXISTS');
    });
    
    it('should reject if already connected', async () => {
      // Create accepted connection
      await createAcceptedConnection(user1.user._id, user2.user._id);
      
      const response = await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() })
        .expect(400);
      
      expectError(response, 400, 'ALREADY_CONNECTED');
    });
    
    it('should allow new request after rejection', async () => {
      // Create rejected connection
      await Connection.create({
        sender: user1.user._id,
        receiver: user2.user._id,
        status: 'rejected',
      });
      
      const response = await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() })
        .expect(201);
      
      expectSuccess(response, 201);
    });
  });
  
  describe('GET /api/connections/pending', () => {
    it('should return empty array when no pending requests', async () => {
      const response = await app
        .get('/api/connections/pending')
        .set(user1.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.requests).toEqual([]);
      expect(data.pagination).toBeDefined();
    });
    
    it('should return pending requests for receiver', async () => {
      // user1 sends request to user2
      await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() });
      
      // user2 should see the request
      const response = await app
        .get('/api/connections/pending')
        .set(user2.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.requests.length).toBe(1);
      expect(data.requests[0].sender.id).toBe(user1.user._id.toString());
      expect(data.requests[0].sender.name).toBe(user1.user.name);
    });
    
    it('should not show sent requests as pending', async () => {
      // user1 sends request to user2
      await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() });
      
      // user1 should not see it in their pending
      const response = await app
        .get('/api/connections/pending')
        .set(user1.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.requests.length).toBe(0);
    });
    
    it('should support pagination', async () => {
      // Create multiple pending requests
      const users = [];
      for (let i = 0; i < 5; i++) {
        const u = await createAuthUser({ email: `pending-${i}-${Date.now()}@example.com` });
        users.push(u);
        await app
          .post('/api/connections/connect')
          .set(u.headers)
          .send({ receiverId: user1.user._id.toString() });
      }
      
      const response = await app
        .get('/api/connections/pending')
        .set(user1.headers)
        .query({ page: 1, limit: 2 })
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.requests.length).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
    });
  });
  
  describe('PUT /api/connections/accept/:id', () => {
    let connectionId: string;
    
    beforeEach(async () => {
      // user1 sends request to user2
      const response = await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() });
      
      connectionId = (expectSuccess(response)).connectionId;
    });
    
    it('should accept connection request', async () => {
      const response = await app
        .put(`/api/connections/accept/${connectionId}`)
        .set(user2.headers) // Receiver accepts
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.message).toBe('Connection accepted');
      
      // Verify connection status
      const connection = await Connection.findById(connectionId);
      expect(connection?.status).toBe('accepted');
    });
    
    it('should reject acceptance by non-receiver', async () => {
      const response = await app
        .put(`/api/connections/accept/${connectionId}`)
        .set(user1.headers) // Sender tries to accept
        .expect(403);
      
      expectError(response, 403, 'NOT_AUTHORIZED');
    });
    
    it('should reject acceptance of non-pending connection', async () => {
      // Accept first
      await app
        .put(`/api/connections/accept/${connectionId}`)
        .set(user2.headers)
        .expect(200);
      
      // Try to accept again
      const response = await app
        .put(`/api/connections/accept/${connectionId}`)
        .set(user2.headers)
        .expect(400);
      
      expectError(response, 400, 'CONNECTION_ALREADY_PROCESSED');
    });
    
    it('should return 404 for non-existent connection', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await app
        .put(`/api/connections/accept/${fakeId}`)
        .set(user2.headers)
        .expect(404);
      
      expectError(response, 404, 'CONNECTION_NOT_FOUND');
    });
  });
  
  describe('PUT /api/connections/reject/:id', () => {
    let connectionId: string;
    
    beforeEach(async () => {
      const response = await app
        .post('/api/connections/connect')
        .set(user1.headers)
        .send({ receiverId: user2.user._id.toString() });
      
      connectionId = (expectSuccess(response)).connectionId;
    });
    
    it('should reject connection request', async () => {
      const response = await app
        .put(`/api/connections/reject/${connectionId}`)
        .set(user2.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.message).toBe('Connection rejected');
      
      // Verify connection status
      const connection = await Connection.findById(connectionId);
      expect(connection?.status).toBe('rejected');
    });
    
    it('should reject rejection by non-receiver', async () => {
      const response = await app
        .put(`/api/connections/reject/${connectionId}`)
        .set(user1.headers)
        .expect(403);
      
      expectError(response, 403, 'NOT_AUTHORIZED');
    });
    
    it('should reject rejection of non-pending connection', async () => {
      // Reject first
      await app
        .put(`/api/connections/reject/${connectionId}`)
        .set(user2.headers)
        .expect(200);
      
      // Try to reject again
      const response = await app
        .put(`/api/connections/reject/${connectionId}`)
        .set(user2.headers)
        .expect(400);
      
      expectError(response, 400, 'CONNECTION_ALREADY_PROCESSED');
    });
  });
});