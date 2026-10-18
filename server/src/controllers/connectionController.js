import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { AppError, ERROR_CODES, asyncHandler } from '../utils/errors.js';
import { sendPushToUser } from '../controllers/pushController.js';

export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (senderId.toString() === receiverId) {
    throw new AppError(ERROR_CODES.CANNOT_CONNECT_SELF, 'Cannot connect to yourself', 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
  }

  const existingConnection = await Connection.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  });

  if (existingConnection) {
    if (existingConnection.status === 'pending') {
      throw new AppError(ERROR_CODES.CONNECTION_ALREADY_EXISTS, 'Connection request already pending', 400);
    }
    if (existingConnection.status === 'accepted') {
      throw new AppError(ERROR_CODES.ALREADY_CONNECTED, 'Already connected', 400);
    }
    // If rejected, allow new request
  }

  const connection = await Connection.create({
    sender: senderId,
    receiver: receiverId,
    status: 'pending',
  });

  const sender = await User.findById(senderId).select('name avatar bio');

  const io = req.app.get('io');
  io.to(receiver.socketId).emit('connection_request', {
    connectionId: connection._id,
    sender: {
      id: sender._id,
      name: sender.name,
      avatar: sender.avatar,
      bio: sender.bio,
    },
  });

  // Send push notification to receiver
  await sendPushToUser(receiverId, {
    title: 'New Connection Request',
    body: `${sender.name} wants to connect with you`,
    data: {
      type: 'connection_request',
      connectionId: connection._id.toString(),
      senderId: sender._id.toString(),
    },
  });

  res.status(201).json({ connectionId: connection._id, message: 'Connection request sent' });
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [connections, total] = await Promise.all([
    Connection.find({
      receiver: req.user._id,
      status: 'pending',
    })
      .populate('sender', 'name avatar bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Connection.countDocuments({
      receiver: req.user._id,
      status: 'pending',
    }),
  ]);

  const requests = connections.map((conn) => ({
    connectionId: conn._id,
    sender: {
      id: conn.sender._id,
      name: conn.sender.name,
      avatar: conn.sender.avatar,
      bio: conn.sender.bio,
    },
    createdAt: conn.createdAt,
  }));

  res.json({
    requests,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const acceptConnection = asyncHandler(async (req, res) => {
  const { connectionId } = req.params;

  const connection = await Connection.findById(connectionId);
  if (!connection) {
    throw new AppError(ERROR_CODES.CONNECTION_NOT_FOUND, 'Connection request not found', 404);
  }

  if (connection.receiver.toString() !== req.user._id.toString()) {
    throw new AppError(ERROR_CODES.NOT_AUTHORIZED, 'Not authorized', 403);
  }

  if (connection.status !== 'pending') {
    throw new AppError(ERROR_CODES.CONNECTION_ALREADY_PROCESSED, 'Connection already processed', 400);
  }

  connection.status = 'accepted';
  await connection.save();

  const receiver = await User.findById(req.user._id).select('name avatar bio');

  const io = req.app.get('io');
  io.to(connection.sender.toString()).emit('connection_accepted', {
    connectionId: connection._id,
    receiver: {
      id: receiver._id,
      name: receiver.name,
      avatar: receiver.avatar,
      bio: receiver.bio,
    },
  });

  res.json({ message: 'Connection accepted' });
});

export const rejectConnection = asyncHandler(async (req, res) => {
  const { connectionId } = req.params;

  const connection = await Connection.findById(connectionId);
  if (!connection) {
    throw new AppError(ERROR_CODES.CONNECTION_NOT_FOUND, 'Connection request not found', 404);
  }

  if (connection.receiver.toString() !== req.user._id.toString()) {
    throw new AppError(ERROR_CODES.NOT_AUTHORIZED, 'Not authorized', 403);
  }

  if (connection.status !== 'pending') {
    throw new AppError(ERROR_CODES.CONNECTION_ALREADY_PROCESSED, 'Connection already processed', 400);
  }

  connection.status = 'rejected';
  await connection.save();

  const io = req.app.get('io');
  io.to(connection.sender.toString()).emit('connection_rejected', {
    connectionId: connection._id,
  });

  res.json({ message: 'Connection rejected' });
});