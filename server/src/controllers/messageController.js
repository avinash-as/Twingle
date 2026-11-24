import Message from '../models/Message.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import { AppError, ERROR_CODES, asyncHandler } from '../utils/errors.js';
import { sendPushToUser } from '../controllers/pushController.js';
import { createMessage, markMessagesRead } from '../services/messageService.js';

export const getConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const pipeline = [
    { $match: { $or: [{ sender: req.user._id }, { receiver: req.user._id }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ['$sender', req.user._id] }, '$receiver', '$sender'] },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$receiver', req.user._id] }, { $eq: ['$isRead', false] }] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        user: { id: '$user._id', name: '$user.name', avatar: '$user.avatar', isOnline: '$user.isOnline', lastSeen: '$user.lastSeen' },
        lastMessage: { content: '$lastMessage.content', createdAt: '$lastMessage.createdAt', sender: '$lastMessage.sender', messageType: '$lastMessage.messageType', mediaUrl: '$lastMessage.mediaUrl' },
        unreadCount: 1,
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ];

  const [conversations, total] = await Promise.all([
    Message.aggregate([...pipeline, { $skip: skip }, { $limit: limitNum }]),
    Message.aggregate([...pipeline, { $count: 'total' }]),
  ]);

  const totalCount = total[0]?.total || 0;

  res.json({
    conversations,
    pagination: { page: pageNum, limit: limitNum, total: totalCount, pages: Math.ceil(totalCount / limitNum) },
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [messages, total] = await Promise.all([
    Message.find({
      $or: [{ sender: req.user._id, receiver: userId }, { sender: userId, receiver: req.user._id }],
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar' } }),
    Message.countDocuments({
      $or: [{ sender: req.user._id, receiver: userId }, { sender: userId, receiver: req.user._id }],
      isDeleted: false,
    }),
  ]);

  await markMessagesRead(req.user._id, userId);

  const io = req.app.get('io');
  io.to(req.user._id.toString()).emit('messages_read', { userId });

  res.json({
    messages: messages.reverse(),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content, messageType = 'text', mediaUrl, mediaMetadata, replyTo } = req.body;

  if (replyTo) {
    const repliedMessage = await Message.findById(replyTo);
    if (!repliedMessage || repliedMessage.isDeleted) {
      throw new AppError(ERROR_CODES.MESSAGE_NOT_FOUND, 'Message to reply to not found', 404);
    }
  }

  const populatedMessage = await createMessage(req.user._id, receiverId, {
    content, messageType, mediaUrl, mediaMetadata, replyTo,
  });

  const io = req.app.get('io');
  io.to(receiverId.toString()).emit('receive_message', populatedMessage);

  await sendPushToUser(receiverId, {
    title: 'New Message',
    body: messageType === 'text' ? content : `Sent a ${messageType}`,
    data: { type: 'message', senderId: req.user._id.toString(), messageId: populatedMessage._id.toString() },
  });

  res.status(201).json(populatedMessage);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  await markMessagesRead(req.user._id, userId);
  const io = req.app.get('io');
  io.to(req.user._id.toString()).emit('messages_read', { userId });
  res.json({ message: 'Messages marked as read' });
});

export const addReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  if (!emoji) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Emoji is required', 400);

  const message = await Message.findById(messageId);
  if (!message || message.isDeleted) throw new AppError(ERROR_CODES.MESSAGE_NOT_FOUND, 'Message not found', 404);

  const existingIndex = message.reactions.findIndex((r) => r.userId.toString() === req.user._id.toString() && r.emoji === emoji);
  if (existingIndex !== -1) {
    message.reactions.splice(existingIndex, 1);
    await message.save();
    res.json({ message: 'Reaction removed', messageId, emoji, action: 'removed' });
  } else {
    message.reactions.push({ emoji, userId: req.user._id, createdAt: new Date() });
    await message.save();
    res.json({ message: 'Reaction added', messageId, emoji, action: 'added' });
  }

  const io = req.app.get('io');
  const updatedMessage = await Message.findById(messageId);
  io.to(req.user._id.toString()).emit('message_reaction_updated', {
    messageId, reactions: updatedMessage.reactions,
    action: existingIndex !== -1 ? 'removed' : 'added',
    userId: req.user._id, emoji,
  });

  if (message.sender.toString() !== req.user._id.toString()) {
    await sendPushToUser(message.sender.toString(), {
      title: 'New Reaction',
      body: `${req.user.name} reacted with ${emoji} to your message`,
      data: { type: 'message_reaction', messageId: message._id.toString(), senderId: req.user._id.toString(), emoji },
    });
  }
});

export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  if (!content || content.trim().length === 0) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Content is required', 400);
  if (content.length > 2000) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Message cannot exceed 2000 characters', 400);

  const message = await Message.findById(messageId);
  if (!message || message.isDeleted) throw new AppError(ERROR_CODES.MESSAGE_NOT_FOUND, 'Message not found', 404);
  if (message.sender.toString() !== req.user._id.toString()) throw new AppError(ERROR_CODES.NOT_AUTHORIZED, 'Not authorized to edit this message', 403);

  message.content = content;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  const updatedMessage = await Message.findById(messageId).populate('sender', 'name avatar').populate('receiver', 'name avatar');
  const io = req.app.get('io');
  io.to(message.receiver.toString()).emit('message_edited', updatedMessage);
  io.to(message.sender.toString()).emit('message_edited', updatedMessage);
  res.json({ message: 'Message updated', message: updatedMessage });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);
  if (!message) throw new AppError(ERROR_CODES.MESSAGE_NOT_FOUND, 'Message not found', 404);
  if (message.sender.toString() !== req.user._id.toString()) throw new AppError(ERROR_CODES.NOT_AUTHORIZED, 'Not authorized to delete this message', 403);

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.content = 'This message was deleted';
  message.mediaUrl = '';
  await message.save();

  const io = req.app.get('io');
  io.to(message.receiver.toString()).emit('message_deleted', { messageId, senderId: message.sender.toString(), receiverId: message.receiver.toString() });
  io.to(message.sender.toString()).emit('message_deleted', { messageId, senderId: message.sender.toString(), receiverId: message.receiver.toString() });
  res.json({ message: 'Message deleted', messageId });
});