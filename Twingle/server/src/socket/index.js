import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import {
  handleUserOnline,
  handleUserOffline,
  handleDisconnect,
  handleUpdateLocation,
  handleSetDiscoverable,
} from './handlers/connectionHandler.js';
import {
  handleSendConnectionRequest,
  handleAcceptConnection,
  handleRejectConnection,
} from './handlers/connectionHandler.js';
import {
  handleSendMessage,
  handleTyping,
  handleStopTyping,
  handleMarkAsRead,
} from './handlers/messageHandler.js';

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.userId})`);

    handleUserOnline(io, socket, socket.userId);

    socket.on('update_location', (data) => {
      handleUpdateLocation(io, socket, socket.userId, data);
    });

    socket.on('set_discoverable', (isDiscoverable) => {
      handleSetDiscoverable(io, socket, socket.userId, isDiscoverable);
    });

    socket.on('send_connection_request', (data) => {
      handleSendConnectionRequest(io, socket, socket.userId, data);
    });

    socket.on('accept_connection', (data) => {
      handleAcceptConnection(io, socket, socket.userId, data);
    });

    socket.on('reject_connection', (data) => {
      handleRejectConnection(io, socket, socket.userId, data);
    });

    socket.on('send_message', (data) => {
      handleSendMessage(io, socket, socket.userId, data);
    });

    socket.on('typing', (data) => {
      handleTyping(io, socket, socket.userId, data);
    });

    socket.on('stop_typing', (data) => {
      handleStopTyping(io, socket, socket.userId, data);
    });

    socket.on('mark_as_read', (data) => {
      handleMarkAsRead(io, socket, socket.userId, data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.userId})`);
      handleDisconnect(io, socket);
    });
  });
};