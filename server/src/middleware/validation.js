import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

/**
 * Generic validation middleware factory
 * @param {Object} schema - Zod schema with optional body, query, params properties
 * @returns Express middleware
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const shape = (schema && typeof schema.shape === 'object')
      ? schema.shape
      : (schema && typeof schema._def?.shape === 'function' ? schema._def.shape() : {});

    const dataToValidate = {};

    if (shape.body) {
      dataToValidate.body = req.body;
    }
    if (shape.query) {
      dataToValidate.query = req.query;
    }
    if (shape.params) {
      dataToValidate.params = req.params;
    }

    const validated = schema.parse(dataToValidate);

    // Replace request data with validated/transformed data
    if (shape.body) req.body = validated.body;
    if (shape.query) req.query = validated.query;
    if (shape.params) req.params = validated.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues || error.errors || [];
      const messages = issues.map(err => {
        const path = (err.path || []).join('.');
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
      const issues = error.issues || error.errors || [];
      const messages = issues.map(err => {
        const path = (err.path || []).join('.');
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