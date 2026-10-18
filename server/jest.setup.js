const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');

// Configure Mongoose buffering with longer timeout
mongoose.set('bufferTimeoutMS', 60000);

// Increase max listeners to avoid warnings
mongoose.connection.setMaxListeners(20);

// Load test environment variables
dotenv.config({ path: '.env.test' });

let mongoServer;

/**
 * Global test setup - runs once before all tests
 */
async function setupTestDB() {
  // Start in-memory MongoDB with longer timeout
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'twingle-test',
    },
    timeout: 60000, // 60 second timeout for startup
  });
  const uri = mongoServer.getUri();

  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  process.env.JWT_EXPIRE = '1h';
  process.env.CLIENT_URL = 'http://localhost:5173';

  // Connect mongoose
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  // Wait for connection to be fully open
  await new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) {
      resolve();
    } else {
      const timeout = setTimeout(() => reject(new Error('MongoDB connection timeout')), 30000);
      mongoose.connection.once('open', () => {
        clearTimeout(timeout);
        resolve();
      });
      mongoose.connection.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    }
  });

  console.log('Test database connected:', uri);
}

/**
 * Global test teardown - runs once after all tests
 */
async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  console.log('Test database disconnected');
}

/**
 * Clear all collections between tests
 */
async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/**
 * Create test user helper
 */
async function createTestUser(overrides = {}) {
  const { default: User } = require('../models/User.js');
  const userData = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    ...overrides,
  };
  return User.create(userData);
}

/**
 * Create authenticated test user with tokens
 */
async function createAuthenticatedUser(overrides = {}) {
  const user = await createTestUser(overrides);
  const { generateAccessToken, generateRefreshToken, hashRefreshToken } = require('../utils/tokens.js');
  const { default: RefreshToken } = require('../models/RefreshToken.js');

  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  await RefreshToken.create({
    user: user._id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { user, accessToken, refreshToken };
}

/**
 * Generate valid auth headers
 */
function getAuthHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Mock Socket.IO for testing
 */
function mockSocketIO() {
  const mockSocket = {
    id: 'test-socket-id',
    userId: 'test-user-id',
    user: { _id: 'test-user-id', name: 'Test User' },
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    handshake: { auth: { token: 'test-token' } },
  };

  const mockIO = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    on: jest.fn(),
    use: jest.fn(),
    sockets: new Map(),
    adapter: {
      sockets: new Map(),
    },
  };

  return { mockSocket, mockIO };
}

module.exports = {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
  createTestUser,
  createAuthenticatedUser,
  getAuthHeaders,
  mockSocketIO,
};