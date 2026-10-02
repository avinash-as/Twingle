import express from 'express';
import {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validateMessage } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.post('/', validateMessage, sendMessage);
router.put('/read/:userId', markAsRead);

export default router;