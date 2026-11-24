import { AppError, ERROR_CODES } from '../utils/errors.js';

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];

export function validateEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'twingle-super-secret-jwt-key-change-in-production') {
    console.error('JWT_SECRET must be changed in production');
    process.exit(1);
  }
}