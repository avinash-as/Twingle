import User from '../../models/User.js';
import Connection from '../../models/Connection.js';
import { ERROR_CODES } from '../../utils/errors.js';
import { sendPushToUser } from '../../controllers/pushController.js';

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
    // Validation already done in socket index
    const { latitude, longitude } = data;
    
    const user = await User.findById(userId);
    if (user) {
      await user.updateLocation(latitude, longitude);
      // Notify clients that a user's location changed so maps can refresh.
      // No coordinates are broadcast; clients re-fetch via the privacy-aware API.
      if (user.locationSharing) {
        io.emit('user_location_updated', { userId: user._id.toString() });
      }
    }
  } catch (error) {
    console.error('Error updating location:', error);
    socket.emit('location_error', { message: 'Failed to update location' });
  }
};

export const handleSetDiscoverable = async (io, socket, userId, isDiscoverable) => {
  try {
    // Validation already done in socket index
    await User.findByIdAndUpdate(userId, { isDiscoverable });
  } catch (error) {
    console.error('Error setting discoverable:', error);
    socket.emit('discoverable_error', { message: 'Failed to update discoverability' });
  }
};

export const handleSendConnectionRequest = async (io, socket, userId, data) => {
  try {
    // Validation already done in socket index
    const { receiverId } = data;

    if (userId.toString() === receiverId) {
      socket.emit('connection_error', { code: ERROR_CODES.CANNOT_CONNECT_SELF, message: 'Cannot connect to yourself' });
      return;
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      socket.emit('connection_error', { code: ERROR_CODES.USER_NOT_FOUND, message: 'User not found' });
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
        socket.emit('connection_error', { code: ERROR_CODES.CONNECTION_ALREADY_EXISTS, message: 'Connection request already pending' });
        return;
      }
      if (existingConnection.status === 'accepted') {
        socket.emit('connection_error', { code: ERROR_CODES.ALREADY_CONNECTED, message: 'Already connected' });
        return;
      }
      // If rejected, allow new request
    }

    const connection = await Connection.create({
      sender: userId,
      receiver: receiverId,
      status: 'pending',
    });

    const sender = await User.findById(userId).select('name avatar bio');

    io.to(receiverId).emit('connection_request', {
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
    socket.emit('connection_error', { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to send connection request' });
  }
};

export const handleAcceptConnection = async (io, socket, userId, data) => {
  try {
    // Validation already done in socket index
    const { connectionId } = data;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      socket.emit('connection_error', { code: ERROR_CODES.CONNECTION_NOT_FOUND, message: 'Connection request not found' });
      return;
    }

    if (connection.receiver.toString() !== userId.toString()) {
      socket.emit('connection_error', { code: ERROR_CODES.NOT_AUTHORIZED, message: 'Not authorized' });
      return;
    }

    if (connection.status !== 'pending') {
      socket.emit('connection_error', { code: ERROR_CODES.CONNECTION_ALREADY_PROCESSED, message: 'Connection already processed' });
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

    // Send push notification to sender that their request was accepted
    await sendPushToUser(connection.sender.toString(), {
      title: 'Connection Accepted',
      body: `${receiver.name} accepted your connection request`,
      data: {
        type: 'connection_accepted',
        connectionId: connection._id.toString(),
        receiverId: userId,
      },
    });

    socket.emit('connection_accepted', { connectionId: connection._id });
  } catch (error) {
    console.error('Error accepting connection:', error);
    socket.emit('connection_error', { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to accept connection' });
  }
};

export const handleRejectConnection = async (io, socket, userId, data) => {
  try {
    // Validation already done in socket index
    const { connectionId } = data;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      socket.emit('connection_error', { code: ERROR_CODES.CONNECTION_NOT_FOUND, message: 'Connection request not found' });
      return;
    }

    if (connection.receiver.toString() !== userId.toString()) {
      socket.emit('connection_error', { code: ERROR_CODES.NOT_AUTHORIZED, message: 'Not authorized' });
      return;
    }

    if (connection.status !== 'pending') {
      socket.emit('connection_error', { code: ERROR_CODES.CONNECTION_ALREADY_PROCESSED, message: 'Connection already processed' });
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
    socket.emit('connection_error', { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to reject connection' });
  }
};