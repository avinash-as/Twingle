import User from '../models/User.js';
import { AppError, ERROR_CODES, asyncHandler } from '../utils/errors.js';
import path from 'path';
import fs from 'fs';

export const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'No file uploaded', 400);
  }
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);

  if (user.photos.length >= 6) {
    // remove uploaded file
    fs.unlinkSync(req.file.path);
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Maximum 6 photos allowed', 400);
  }

  const url = `/uploads/photos/${req.file.filename}`;
  user.photos.push(url);
  if (!user.avatar) user.avatar = url;
  await user.save();

  res.status(201).json({ photo: url, photos: user.photos, avatar: user.avatar });
});

export const deletePhoto = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Photo url required', 400);

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);

  user.photos = user.photos.filter((p) => p !== url);
  if (user.avatar === url) {
    user.avatar = user.photos.length ? user.photos[0] : '';
  }
  await user.save();

  // best-effort delete file
  try {
    const filePath = path.join(process.cwd(), url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}

  res.json({ photos: user.photos, avatar: user.avatar });
});

export const setAvatar = asyncHandler(async (req, res) => {
  const { url } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
  if (url && !user.photos.includes(url)) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Photo not found', 400);
  }
  user.avatar = url || (user.photos.length ? user.photos[0] : '');
  await user.save();
  res.json({ avatar: user.avatar, photos: user.photos });
});