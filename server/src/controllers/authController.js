import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { config } from '../config/env.js';
import { AppError, ERROR_CODES, asyncHandler } from '../utils/errors.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenCookieOptions,
} from '../utils/tokens.js';

const createTokenPair = async (user, req) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  // Store hashed refresh token in database
  await RefreshToken.create({
    user: user._id,
    tokenHash: refreshTokenHash,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS, 'User already exists', 400);
  }

  const user = await User.create({ name, email, password });
  const { accessToken, refreshToken } = await createTokenPair(user, req);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  res.status(201).json({
    accessToken,
    user: user.getPublicProfile(),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid credentials', 401);
  }

  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save();

  const { accessToken, refreshToken } = await createTokenPair(user, req);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  res.json({
    accessToken,
    user: user.getPublicProfile(),
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    throw new AppError(ERROR_CODES.TOKEN_INVALID, 'Refresh token required', 401);
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);

  // Find valid refresh token
  const storedToken = await RefreshToken.findOne({
    tokenHash: refreshTokenHash,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!storedToken) {
    throw new AppError(ERROR_CODES.TOKEN_INVALID, 'Invalid or expired refresh token', 401);
  }

  // Get user
  const user = await User.findById(storedToken.user);
  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 401);
  }

  // Revoke old refresh token (rotation)
  storedToken.revoked = true;
  storedToken.revokedAt = new Date();
  await storedToken.save();

  // Create new token pair
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await createTokenPair(user, req);

  // Set new refresh token cookie
  res.cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions);

  res.json({
    accessToken: newAccessToken,
    user: user.getPublicProfile(),
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
  }
  res.json(user.getPublicProfile());
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (refreshToken) {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    
    // Revoke the refresh token
    await RefreshToken.findOneAndUpdate(
      { tokenHash: refreshTokenHash },
      { revoked: true, revokedAt: new Date() }
    );
  }

  const user = await User.findById(req.user._id);
  if (user) {
    user.isOnline = false;
    user.socketId = null;
    user.lastSeen = new Date();
    await user.save();
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken', { ...refreshTokenCookieOptions, maxAge: 0 });

  res.json({ message: 'Logged out successfully' });
});

export const logoutAll = asyncHandler(async (req, res) => {
  // Revoke all refresh tokens for this user
  await RefreshToken.updateMany(
    { user: req.user._id, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );

  const user = await User.findById(req.user._id);
  if (user) {
    user.isOnline = false;
    user.socketId = null;
    user.lastSeen = new Date();
    await user.save();
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken', { ...refreshTokenCookieOptions, maxAge: 0 });

  res.json({ message: 'Logged out from all devices successfully' });
});