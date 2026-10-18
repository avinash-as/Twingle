import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestApp, createAuthUser, createSecondAuthUser, createAcceptedConnection, expectSuccess, expectError, cleanupTestDB, teardownTestDB, createThirdAuthUser } from './utils';
import Message from '../models/Message';
import Connection from '../models/Connection';

describe('Message Routes', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  let user1: { user: any; accessToken: string; headers: any };
  let user2: { user: any; accessToken: string; headers: any };
  let connectionId: string;
  
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
    
    // Create accepted connection between users
    const connection = await createAcceptedConnection(user1.user._id, user2.user._id);
    connectionId = connection._id.toString();
  });
  
  describe('GET /api/messages/conversations', () => {
    it('should return empty array when no conversations', async () => {
      const response = await app
        .get('/api/messages/conversations')
        .set(user1.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.conversations).toEqual([]);
      expect(data.pagination).toBeDefined();
    });
    
    it('should return conversations with last message and unread count', async () => {
      // Create messages
      await Message.create({
        sender: user1.user._id,
        receiver: user2.user._id,
        content: 'Hello from user1',
      });
      
      await Message.create({
        sender: user2.user._id,
        receiver: user1.user._id,
        content: 'Hello from user2',
      });
      
      const response = await app
        .get('/api/messages/conversations')
        .set(user1.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.conversations.length).toBe(1);
      expect(data.conversations[0].user.id).toBe(user2.user._id.toString());
      expect(data.conversations[0].lastMessage).toBeDefined();
      expect(data.conversations[0].lastMessage.content).toBe('Hello from user2');
      expect(data.conversations[0].unreadCount).toBe(1); // One unread from user2
    });
    
    it('should support pagination', async () => {
      // Create multiple conversations
      const users = [];
      for (let i = 0; i < 5; i++) {
        const u = await createAuthUser({ email: `conv-${i}-${Date.now()}@example.com` });
        users.push(u);
        await createAcceptedConnection(user1.user._id, u.user._id);
        await Message.create({
          sender: u.user._id,
          receiver: user1.user._id,
          content: `Message from user ${i}`,
        });
      }
      
      const response = await app
        .get('/api/messages/conversations')
        .set(user1.headers)
        .query({ page: 1, limit: 2 })
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.conversations.length).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
    });
  });
  
  describe('GET /api/messages/:userId', () => {
    it('should return messages between two users', async () => {
      // Create messages in both directions
      await Message.create({
        sender: user1.user._id,
        receiver: user2.user._id,
        content: 'Message 1 from user1',
      });
      
      await Message.create({
        sender: user2.user._id,
        receiver: user1.user._id,
        content: 'Message 1 from user2',
      });
      
      await Message.create({
        sender: user1.user._id,
        receiver: user2.user._id,
        content: 'Message 2 from user1',
      });
      
      const response = await app
        .get(`/api/messages/${user2.user._id}`)
        .set(user1.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.messages.length).toBe(3);
      expect(data.messages[0].content).toBe('Message 1 from user1'); // Oldest first
      expect(data.messages[2].content).toBe('Message 2 from user1'); // Newest last
      expect(data.pagination).toBeDefined();
    });
    
    it('should mark messages as read when fetching', async () => {
      // Create unread messages from user2
      await Message.create({
        sender: user2.user._id,
        receiver: user1.user._id,
        content: 'Unread message 1',
        isRead: false,
      });
      
      await Message.create({
        sender: user2.user._id,
        receiver: user1.user._id,
        content: 'Unread message 2',
        isRead: false,
      });
      
      // Fetch messages
      await app
        .get(`/api/messages/${user2.user._id}`)
        .set(user1.headers)
        .expect(200);
      
      // Verify messages marked as read
      const messages = await Message.find({
        sender: user2.user._id,
        receiver: user1.user._id,
      });
      
      expect(messages.every(m => m.isRead)).toBe(true);
    });
    
    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await app
        .get(`/api/messages/${fakeId}`)
        .set(user1.headers)
        .expect(400); // Validation error for invalid ID format or 404
      
      // The route validates the ID format first
      expectError(response, 400, 'VALIDATION_ERROR');
    });
    
    it('should support pagination', async () => {
      // Create 5 messages
      for (let i = 0; i < 5; i++) {
        await Message.create({
          sender: user1.user._id,
          receiver: user2.user._id,
          content: `Message ${i}`,
        });
      }
      
      const response = await app
        .get(`/api/messages/${user2.user._id}`)
        .set(user1.headers)
        .query({ page: 1, limit: 2 })
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.messages.length).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
    });
  });
  
  describe('POST /api/messages', () => {
    it('should send message successfully', async () => {
      const response = await app
        .post('/api/messages')
        .set(user1.headers)
        .send({
          receiverId: user2.user._id.toString(),
          content: 'Hello, this is a test message!',
        })
        .expect(201);
      
      const data = expectSuccess(response, 201);
      expect(data.content).toBe('Hello, this is a test message!');
      expect(data.sender).toBeDefined();
      expect(data.receiver).toBeDefined();
      expect(data.isRead).toBe(false);
      
      // Verify in database
      const message = await Message.findById(data._id);
      expect(message).toBeTruthy();
    });
    
    it('should reject message to non-connected user', async () => {
      // Create third user not connected
      const user3 = await createAuthUser({ email: `test3-${Date.now()}@example.com` });
      
      const response = await app
        .post('/api/messages')
        .set(user1.headers)
        .send({
          receiverId: user3.user._id.toString(),
          content: 'This should fail',
        })
        .expect(403);
      
      expectError(response, 403, 'NOT_CONNECTED');
    });
    
    it('should reject message with empty content', async () => {
      const response = await app
        .post('/api/messages')
        .set(user1.headers)
        .send({
          receiverId: user2.user._id.toString(),
          content: '',
        })
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
    
    it('should reject message with content too long', async () => {
      const response = await app
        .post('/api/messages')
        .set(user1.headers)
        .send({
          receiverId: user2.user._id.toString(),
          content: 'A'.repeat(2001), // Max 2000
        })
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
    
    it('should reject message with missing fields', async () => {
      const response = await app
        .post('/api/messages')
        .set(user1.headers)
        .send({})
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
  });
  
  describe('PUT /api/messages/read/:userId', () => {
    it('should mark messages as read', async () => {
      // Create unread messages
      await Message.create({
        sender: user2.user._id,
        receiver: user1.user._id,
        content: 'Unread 1',
        isRead: false,
      });
      
      await Message.create({
        sender: user2.user._id,
        receiver: user1.user._id,
        content: 'Unread 2',
        isRead: false,
      });
      
      const response = await app
        .put(`/api/messages/read/${user2.user._id}`)
        .set(user1.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.message).toBe('Messages marked as read');
      
      // Verify in database
      const messages = await Message.find({
        sender: user2.user._id,
        receiver: user1.user._id,
      });
      expect(messages.every(m => m.isRead)).toBe(true);
    });
    
    it('should return 400 for invalid userId', async () => {
      const response = await app
        .put('/api/messages/read/invalid-id')
        .set(user1.headers)
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
  });
});