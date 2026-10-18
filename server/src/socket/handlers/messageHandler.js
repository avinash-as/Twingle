import Connection from '../../models/Connection.js';
import Message from '../../models/Message.js';
import { ERROR_CODES } from '../../utils/errors.js';

export const handleSendMessage = async (io, socket, userId, data) => {
  try {
    // Validation already done in socket index
    const { receiverId, content } = data;

    const connection = await Connection.findOne({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
      status: 'accepted',
    });

    if (!connection) {
      socket.emit('message_error', { code: ERROR_CODES.NOT_CONNECTED, message: 'Not connected to this user' });
      return;
    }

    const message = await Message.create({
      sender: userId,
      receiver: receiverId,
      content,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    io.to(receiverId).emit('receive_message', populatedMessage);
    socket.emit('message_sent', populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit('message_error', { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to send message' });
  }
};

export const handleTyping = (io, socket, userId, data) => {
  // Validation already done in socket index
  const { receiverId } = data;
  io.to(receiverId).emit('user_typing', { userId });
};

export const handleStopTyping = (io, socket, userId, data) => {
  // Validation already done in socket index
  const { receiverId } = data;
  io.to(receiverId).emit('user_stop_typing', { userId });
};

export const handleMarkAsRead = async (io, socket, userId, data) => {
  try {
    // Validation already done in socket index
    const { receiverId } = data;

    await Message.updateMany(
      { sender: receiverId, receiver: userId, isRead: false },
      { isRead: true }
    );

    io.to(userId).emit('messages_read', { userId: receiverId });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    socket.emit('message_error', { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to mark messages as read' });
  }
};