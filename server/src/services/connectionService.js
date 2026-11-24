import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Create a connection request between two users.
 * Handles self-connection, missing receiver, existing/reverse connections,
 * and mutual-match auto-accept.
 *
 * Returns { connection, matched, sender, receiver }.
 */
export async function createConnectionRequest(senderId, receiverId) {
  if (senderId.toString() === receiverId.toString()) {
    throw new AppError(ERROR_CODES.CANNOT_CONNECT_SELF, 'Cannot connect to yourself', 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
  }

  // Mutual like => instant match
  const reversePending = await Connection.findOne({
    sender: receiverId,
    receiver: senderId,
    status: 'pending',
  });

  if (reversePending) {
    reversePending.status = 'accepted';
    await reversePending.save();
    const sender = await User.findById(senderId).select('name avatar bio');
    return { connection: reversePending, matched: true, sender, receiver };
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
  }

  const connection = await Connection.create({
    sender: senderId,
    receiver: receiverId,
    status: 'pending',
  });

  const sender = await User.findById(senderId).select('name avatar bio');
  return { connection, matched: false, sender, receiver };
}