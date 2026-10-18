import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  addReaction,
  editMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  sendMessageSchema,
  getMessagesSchema,
  markAsReadSchema,
  getConversationsSchema,
  addReactionSchema,
  editMessageSchema,
} from '../validations/schemas.js';
import { messageLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', validate(getConversationsSchema), getConversations);
router.get('/:userId', validate(getMessagesSchema), getMessages);
router.post('/', messageLimiter, validate(sendMessageSchema), sendMessage);
router.put('/read/:userId', validate(markAsReadSchema), markAsRead);
router.post('/:messageId/reaction', validate(addReactionSchema), addReaction);
router.put('/:messageId', validate(editMessageSchema), editMessage);
router.delete('/:messageId', deleteMessage);

export default router;