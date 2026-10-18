import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

/**
 * Generic validation middleware factory
 * @param {Object} schema - Zod schema with optional body, query, params properties
 * @returns Express middleware
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const dataToValidate = {};
    
    if (schema.body) {
      dataToValidate.body = req.body;
    }
    if (schema.query) {
      dataToValidate.query = req.query;
    }
    if (schema.params) {
      dataToValidate.params = req.params;
    }

    const validated = schema.parse(dataToValidate);
    
    // Replace request data with validated/transformed data
    if (schema.body) req.body = validated.body;
    if (schema.query) req.query = validated.query;
    if (schema.params) req.params = validated.params;
    
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      return next(new AppError('VALIDATION_ERROR', messages.join('; '), 400));
    }
    next(error);
  }
};

/**
 * Validate socket event data
 * @param {z.ZodSchema} schema - Zod schema for the event data
 * @returns Function that validates and returns { success: boolean, data?, error? }
 */
export const validateSocketEvent = (schema) => (data) => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      return { success: false, error: messages.join('; ') };
    }
    return { success: false, error: 'Validation failed' };
  }
};

/**
 * Sanitize output - remove sensitive fields from response
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, socketId, __v, ...safeUser } = user.toObject ? user.toObject() : user;
  return safeUser;
};

export const sanitizeUsers = (users) => users.map(sanitizeUser);