import express from 'express';
import {
  updateLocation,
  getNearbyUsers,
  getUserProfile,
  updateProfile,
  setDiscoverable,
  getConnectedUsers,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validateLocation } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router.post('/location', validateLocation, updateLocation);
router.get('/nearby', getNearbyUsers);
router.get('/connected', getConnectedUsers);
router.get('/profile/:id', getUserProfile);
router.put('/profile', updateProfile);
router.put('/discoverable', setDiscoverable);

export default router;