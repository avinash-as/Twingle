import express from 'express';
import {
  sendConnectionRequest,
  getPendingRequests,
  acceptConnection,
  rejectConnection,
} from '../controllers/connectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/connect', sendConnectionRequest);
router.get('/pending', getPendingRequests);
router.put('/accept/:id', acceptConnection);
router.put('/reject/:id', rejectConnection);

export default router;