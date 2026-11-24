import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

export async function ensureConnection(senderId, receiverId) {
  const connection = await Connection.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
    status: 'accepted',
  });
  if (!connection) {
    throw new AppError(ERROR_CODES.NOT_CONNECTED, 'Not connected to this user', 403);
  }
  return connection;
}

export async function createMessage(senderId, receiverId, payload) {
  await ensureConnection(senderId, receiverId);

  const { content, messageType = 'text', mediaUrl, mediaMetadata, replyTo } = payload;

  if (messageType !== 'text' && !mediaUrl) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Media URL is required for non-text messages', 400);
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content: messageType === 'text' ? content : '',
    messageType,
    mediaUrl: mediaUrl || '',
    mediaMetadata: mediaMetadata || null,
    replyTo: replyTo || null,
  });

  const populated = await Message.findById(message._id)
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar' } });

  return populated;
}

export async function markMessagesRead(receiverId, senderId) {
  await Message.updateMany(
    { sender: senderId, receiver: receiverId, isRead: false },
    { isRead: true }
  );
}