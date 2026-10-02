import express from 'express';
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  getPendingConnections,
} from '../controllers/connectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/connect', sendConnectionRequest);
router.get('/pending', getPendingConnections);
router.put('/accept/:connectionId', acceptConnection);
router.put('/reject/:connectionId', rejectConnection);

export default router;