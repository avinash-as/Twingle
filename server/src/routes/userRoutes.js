import express from 'express';
import {
  updateLocation,
  getNearbyUsers,
  getUserProfile,
  updateProfile,
  setDiscoverable,
  getConnectedUsers,
  batchLocation,
  updateLocationSharing,
  updateNearbyDiscovery,
  updateGhostMode,
  getLocationPrivacy,
  getMapNearbyUsers,
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
router.get('/location/privacy', getLocationPrivacy);
router.put('/location/sharing', profileLimiter, updateLocationSharing);
router.put('/nearby-discovery', profileLimiter, updateNearbyDiscovery);
router.put('/ghost-mode', profileLimiter, updateGhostMode);
router.get('/map/nearby', scanLimiter, getMapNearbyUsers);

export default router;