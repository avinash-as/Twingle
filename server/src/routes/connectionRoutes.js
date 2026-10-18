import express from 'express';
import {
  sendConnectionRequest,
  getPendingRequests,
  acceptConnection,
  rejectConnection,
} from '../controllers/connectionController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  sendConnectionRequestSchema,
  connectionIdParamSchema,
  getPendingRequestsSchema,
} from '../validations/schemas.js';
import { connectionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.post('/connect', connectionLimiter, validate(sendConnectionRequestSchema), sendConnectionRequest);
router.get('/pending', validate(getPendingRequestsSchema), getPendingRequests);
router.put('/accept/:id', validate(connectionIdParamSchema), acceptConnection);
router.put('/reject/:id', validate(connectionIdParamSchema), rejectConnection);

export default router;