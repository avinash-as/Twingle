import User from '../models/User.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 401);
      }
      
      next();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.code, message: error.message },
        });
      }
      return res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.TOKEN_INVALID, message: 'Not authorized, token failed' },
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authorized, no token' },
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
      req.user = null;
    }
  }
  next();
};