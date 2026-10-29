// Support a comma-separated list of allowed frontend origins in CLIENT_URL
// (e.g. "http://localhost:5173,https://twingle.vercel.app").
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Always allow local dev and the production frontend, even if CLIENT_URL is
// misconfigured or unset on the hosting platform.
const defaultOrigins = ['http://localhost:5173', 'https://twingle.vercel.app'];

export const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/twingle',
  jwtSecret: process.env.JWT_SECRET || 'twingle-super-secret-jwt-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  clientUrl: envOrigins[0] || defaultOrigins[0],
  allowedOrigins,
};