import express from 'express';
import {
  updateLocation,
  getNearbyUsers,
  getUserProfile,
  updateProfile,
  setDiscoverable,
  getConnectedUsers,
  batchLocation,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  updateLocationSchema,
  getNearbyUsersSchema,
  getUserProfileSchema,
  updateProfileSchema,
  setDiscoverableSchema,
  batchLocationSchema,
} from '../validations/schemas.js';
import { locationLimiter, scanLimiter, profileLimiter, batchLocationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.post('/location', locationLimiter, validate(updateLocationSchema), updateLocation);
router.post('/location/batch', batchLocationLimiter, validate(batchLocationSchema), batchLocation);
router.get('/nearby', scanLimiter, validate(getNearbyUsersSchema), getNearbyUsers);
router.get('/connected', getConnectedUsers);
router.get('/profile/:id', validate(getUserProfileSchema), getUserProfile);
router.put('/profile', profileLimiter, validate(updateProfileSchema), updateProfile);
router.put('/discoverable', profileLimiter, validate(setDiscoverableSchema), setDiscoverable);

export default router;