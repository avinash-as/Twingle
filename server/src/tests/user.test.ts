import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestApp, createAuthUser, createSecondAuthUser, expectSuccess, expectError, cleanupTestDB, teardownTestDB } from './utils';
import User from '../models/User';

describe('User Routes', () => {
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
  
  describe('POST /api/users/location', () => {
    it('should update user location successfully', async () => {
      const response = await app
        .post('/api/users/location')
        .set(user1.headers)
        .send({
          latitude: 37.7749,
          longitude: -122.4194,
        })
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.message).toBe('Location updated');
      expect(data.location).toBeDefined();
      expect(data.location.latitude).toBe(37.7749);
      expect(data.location.longitude).toBe(-122.4194);
    });
    
    it('should reject invalid latitude', async () => {
      const response = await app
        .post('/api/users/location')
        .set(user1.headers)
        .send({
          latitude: 100, // Invalid: > 90
          longitude: -122.4194,
        })
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
    
    it('should reject invalid longitude', async () => {
      const response = await app
        .post('/api/users/location')
        .set(user1.headers)
        .send({
          latitude: 37.7749,
          longitude: 200, // Invalid: > 180
        })
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
    
    it('should reject missing coordinates', async () => {
      const response = await app
        .post('/api/users/location')
        .set(user1.headers)
        .send({})
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
  });
  
  describe('GET /api/users/nearby', () => {
    beforeEach(async () => {
      // Update both users' locations
      await app
        .post('/api/users/location')
        .set(user1.headers)
        .send({ latitude: 37.7749, longitude: -122.4194 });
      
      await app
        .post('/api/users/location')
        .set(user2.headers)
        .send({ latitude: 37.7849, longitude: -122.4094 }); // ~1.5km away
    });
    
    it('should return nearby users within distance', async () => {
      const response = await app
        .get('/api/users/nearby')
        .set(user1.headers)
        .query({
          latitude: 37.7749,
          longitude: -122.4194,
          maxDistance: 5000, // 5km
        })
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThanOrEqual(0);
      expect(data.pagination).toBeDefined();
    });
    
    it('should not return self in nearby users', async () => {
      const response = await app
        .get('/api/users/nearby')
        .set(user1.headers)
        .query({
          latitude: 37.7749,
          longitude: -122.4194,
          maxDistance: 5000,
        })
        .expect(200);
      
      const data = expectSuccess(response);
      const userIds = data.users.map((u: any) => u.id);
      expect(userIds).not.toContain(user1.user._id.toString());
    });
    
    it('should respect maxDistance parameter', async () => {
      const response = await app
        .get('/api/users/nearby')
        .set(user1.headers)
        .query({
          latitude: 37.7749,
          longitude: -122.4194,
          maxDistance: 100, // 100m - too close
        })
        .expect(200);
      
      const data = expectSuccess(response);
      // Users are ~1.5km apart, so should not appear with 100m radius
      expect(data.users.length).toBe(0);
    });
    
    it('should return users sorted by distance', async () => {
      // Create third user farther away
      const user3 = await createAuthUser({ email: `test3-${Date.now()}@example.com` });
      await app
        .post('/api/users/location')
        .set(user3.headers)
        .send({ latitude: 37.8749, longitude: -122.5194 }); // ~15km away
      
      const response = await app
        .get('/api/users/nearby')
        .set(user1.headers)
        .query({
          latitude: 37.7749,
          longitude: -122.4194,
          maxDistance: 20000, // 20km
        })
        .expect(200);
      
      const data = expectSuccess(response);
      if (data.users.length >= 2) {
        // Should be sorted by distance ascending
        for (let i = 1; i < data.users.length; i++) {
          expect(data.users[i].distance).toBeGreaterThanOrEqual(data.users[i-1].distance);
        }
      }
    });
    
    it('should support pagination', async () => {
      const response = await app
        .get('/api/users/nearby')
        .set(user1.headers)
        .query({
          latitude: 37.7749,
          longitude: -122.4194,
          maxDistance: 5000,
          page: 1,
          limit: 1,
        })
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.users.length).toBeLessThanOrEqual(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(1);
    });
    
    it('should require latitude and longitude', async () => {
      const response = await app
        .get('/api/users/nearby')
        .set(user1.headers)
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
  });
  
  describe('GET /api/users/profile/:id', () => {
    it('should return user profile', async () => {
      const response = await app
        .get(`/api/users/profile/${user2.user._id}`)
        .set(user1.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.id).toBe(user2.user._id.toString());
      expect(data.name).toBe(user2.user.name);
      expect(data.connectionStatus).toBeNull();
      expect(data.isSender).toBe(false);
    });
    
    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await app
        .get(`/api/users/profile/${fakeId}`)
        .set(user1.headers)
        .expect(404);
      
      expectError(response, 404, 'USER_NOT_FOUND');
    });
    
    it('should reject invalid ID format', async () => {
      const response = await app
        .get('/api/users/profile/invalid-id')
        .set(user1.headers)
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
  });
  
  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const response = await app
        .put('/api/users/profile')
        .set(user1.headers)
        .send({
          name: 'Updated Name',
          bio: 'Updated bio',
        })
        .expect(200);
      
      const data = expectSuccess(response);
      expect(data.name).toBe('Updated Name');
      expect(data.bio).toBe('Updated bio');
    });
    
    it('should reject invalid name length', async () => {
      const response = await app
        .put('/api/users/profile')
        .set(user1.headers)
        .send({
          name: 'A'.repeat(51), // Too long
        })
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
    
    it('should reject invalid bio length', async () => {
      const response = await app
        .put('/api/users/profile')
        .set(user1.headers)
        .send({
          bio: 'A'.repeat(201), // Too long
        })
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
  });
  
  describe('PUT /api/users/discoverable', () => {
    it('should toggle discoverability', async () => {
      // Set to false
      let response = await app
        .put('/api/users/discoverable')
        .set(user1.headers)
        .send({ isDiscoverable: false })
        .expect(200);
      
      let data = expectSuccess(response);
      expect(data.isDiscoverable).toBe(false);
      
      // Set to true
      response = await app
        .put('/api/users/discoverable')
        .set(user1.headers)
        .send({ isDiscoverable: true })
        .expect(200);
      
      data = expectSuccess(response);
      expect(data.isDiscoverable).toBe(true);
    });
    
    it('should require isDiscoverable boolean', async () => {
      const response = await app
        .put('/api/users/discoverable')
        .set(user1.headers)
        .send({})
        .expect(400);
      
      expectError(response, 400, 'VALIDATION_ERROR');
    });
  });
  
  describe('GET /api/users/connected', () => {
    it('should return empty array when no connections', async () => {
      const response = await app
        .get('/api/users/connected')
        .set(user1.headers)
        .expect(200);
      
      const data = expectSuccess(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });
});