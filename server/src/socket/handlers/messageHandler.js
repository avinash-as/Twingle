import User from '../../models/User.js';
import Connection from '../../models/Connection.js';

export const handleUserOnline = async (io, socket, userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline: true, socketId: socket.id, lastSeen: new Date() },
      { new: true }
    );

    if (user) {
      io.emit('user_online', {
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
      });

      socket.emit('online_users', { userId: user._id });
    }
  } catch (error) {
    console.error('Error handling user online:', error);
  }
};

export const handleUserOffline = async (io, socket, userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      socketId: null,
      lastSeen: new Date(),
    });

    io.emit('user_offline', { userId });
  } catch (error) {
    console.error('Error handling user offline:', error);
  }
};

export const handleDisconnect = async (io, socket) => {
  try {
    const user = await User.findOne({ socketId: socket.id });
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        isOnline: false,
        socketId: null,
        lastSeen: new Date(),
      });

      io.emit('user_offline', { userId: user._id });
    }
  } catch (error) {
    console.error('Error handling disconnect:', error);
  }
};

export const handleUpdateLocation = async (io, socket, userId, data) => {
  try {
    await User.findByIdAndUpdate(userId, {
      location: { latitude: data.latitude, longitude: data.longitude },
      lastSeen: new Date(),
    });
  } catch (error) {
    console.error('Error updating location:', error);
  }
};

export const handleSetDiscoverable = async (io, socket, userId, isDiscoverable) => {
  try {
    await User.findByIdAndUpdate(userId, { isDiscoverable });
  } catch (error) {
    console.error('Error setting discoverable:', error);
  }
};

export const handleSendConnectionRequest = async (io, socket, userId, data) => {
  try {
    const { receiverId } = data;

    if (userId.toString() === receiverId) {
      socket.emit('connection_error', { message: 'Cannot connect to yourself' });
      return;
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      socket.emit('connection_error', { message: 'User not found' });
      return;
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        socket.emit('connection_error', { message: 'Connection request already pending' });
        return;
      }
      if (existingConnection.status === 'accepted') {
        socket.emit('connection_error', { message: 'Already connected' });
        return;
      }
    }

    const connection = await Connection.create({
      sender: userId,
      receiver: receiverId,
      status: 'pending',
    });

    const sender = await User.findById(userId).select('name avatar bio');

    io.to(receiver.socketId).emit('connection_request', {
      connectionId: connection._id,
      sender: {
        id: sender._id,
        name: sender.name,
        avatar: sender.avatar,
        bio: sender.bio,
      },
    });

    socket.emit('connection_request_sent', { connectionId: connection._id });
  } catch (error) {
    console.error('Error sending connection request:', error);
    socket.emit('connection_error', { message: error.message });
  }
};

export const handleAcceptConnection = async (io, socket, userId, data) => {
  try {
    const { connectionId } = data;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      socket.emit('connection_error', { message: 'Connection request not found' });
      return;
    }

    if (connection.receiver.toString() !== userId.toString()) {
      socket.emit('connection_error', { message: 'Not authorized' });
      return;
    }

    if (connection.status !== 'pending') {
      socket.emit('connection_error', { message: 'Connection already processed' });
      return;
    }

    connection.status = 'accepted';
    await connection.save();

    const receiver = await User.findById(userId).select('name avatar bio');

    io.to(connection.sender.toString()).emit('connection_accepted', {
      connectionId: connection._id,
      receiver: {
        id: receiver._id,
        name: receiver.name,
        avatar: receiver.avatar,
        bio: receiver.bio,
      },
    });

    socket.emit('connection_accepted', { connectionId: connection._id });
  } catch (error) {
    console.error('Error accepting connection:', error);
    socket.emit('connection_error', { message: error.message });
  }
};

export const handleRejectConnection = async (io, socket, userId, data) => {
  try {
    const { connectionId } = data;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      socket.emit('connection_error', { message: 'Connection request not found' });
      return;
    }

    if (connection.receiver.toString() !== userId.toString()) {
      socket.emit('connection_error', { message: 'Not authorized' });
      return;
    }

    if (connection.status !== 'pending') {
      socket.emit('connection_error', { message: 'Connection already processed' });
      return;
    }

    connection.status = 'rejected';
    await connection.save();

    io.to(connection.sender.toString()).emit('connection_rejected', {
      connectionId: connection._id,
    });

    socket.emit('connection_rejected', { connectionId: connection._id });
  } catch (error) {
    console.error('Error rejecting connection:', error);
    socket.emit('connection_error', { message: error.message });
  }
};

export const handleSendMessage = async (io, socket, userId, data) => {
  try {
    const { receiverId, content } = data;

    const Connection = (await import('../../models/Connection.js')).default;
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

    const Message = (await import('../../models/Message.js')).default;
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
    socket.emit('message_error', { message: error.message });
  }
};

export const handleTyping = (io, socket, userId, data) => {
  const { receiverId } = data;
  io.to(receiverId).emit('user_typing', { userId });
};

export const handleStopTyping = (io, socket, userId, data) => {
  const { receiverId } = data;
  io.to(receiverId).emit('user_stop_typing', { userId });
};

export const handleMarkAsRead = async (io, socket, userId, data) => {
  try {
    const { receiverId } = data;

    const Message = (await import('../../models/Message.js')).default;
    await Message.updateMany(
      { sender: receiverId, receiver: userId, isRead: false },
      { isRead: true }
    );

    io.to(userId).emit('messages_read', { userId: receiverId });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};