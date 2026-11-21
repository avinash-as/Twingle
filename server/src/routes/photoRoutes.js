import express from 'express';
import { protect } from '../middleware/auth.js';
import { uploadPhotoMiddleware } from '../middleware/upload.js';
import { uploadPhoto, deletePhoto, setAvatar } from '../controllers/photoController.js';

const router = express.Router();
router.use(protect);

router.post('/upload', uploadPhotoMiddleware.single('photo'), uploadPhoto);
router.delete('/', deletePhoto);
router.put('/avatar', setAvatar);

export default router;