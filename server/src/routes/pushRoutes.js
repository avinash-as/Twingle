import express from 'express';
import {
  subscribe,
  unsubscribe,
  getStatus,
  sendTest,
} from '../controllers/pushController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.get('/status', getStatus);
router.post('/test', sendTest);

export default router;