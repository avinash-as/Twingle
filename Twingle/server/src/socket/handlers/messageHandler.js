import Message from '../../models/Message.js';
import Connection from '../../models/Connection.js';
import User from '../../models/User.js';

export const handleSendMessage = async (io, socket, userId, data) => {
  try {
    const { receiverId, message } = data;

    const connection = await Connection.findOne({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
      status: 'accepted',
    });

    if (!connection) {
      socket.emit('message_error', { message: 'Not connected to this user' });
      return;
    }

    const newMessage = await Message.create({
      sender: userId,
      receiver: receiverId,
      message,
    });

    const populatedMessage = await Message.findById(newMessage._id).populate(
      'sender',
      'name avatar'
    );

    io.to(receiverId.toString()).emit('receive_message', {
      message: populatedMessage,
    });

    socket.emit('message_sent', { message: populatedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit('message_error', { message: error.message });
  }
};

export const handleTyping = async (io, socket, userId, data) => {
  try {
    const { receiverId } = data;

    const connection = await Connection.findOne({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
      status: 'accepted',
    });

    if (!connection) return;

    const user = await User.findById(userId).select('name');

    io.to(receiverId.toString()).emit('user_typing', {
      userId,
      name: user.name,
    });
  } catch (error) {
    console.error('Error handling typing:', error);
  }
};

export const handleStopTyping = async (io, socket, userId, data) => {
  try {
    const { receiverId } = data;

    const connection = await Connection.findOne({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
      status: 'accepted',
    });

    if (!connection) return;

    io.to(receiverId.toString()).emit('user_stop_typing', { userId });
  } catch (error) {
    console.error('Error handling stop typing:', error);
  }
};

export const handleMarkAsRead = async (io, socket, userId, data) => {
  try {
    const { senderId } = data;

    await Message.updateMany(
      { sender: senderId, receiver: userId, read: false },
      { read: true }
    );

    io.to(senderId.toString()).emit('messages_read', { readerId: userId });
  } catch (error) {
    console.error('Error marking as read:', error);
  }
};