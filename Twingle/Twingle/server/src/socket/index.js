import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import * as connectionHandler from './handlers/connectionHandler.js';
import * as messageHandler from './handlers/messageHandler.js';

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

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${socket.user.name} (${userId})`);

    await connectionHandler.handleUserOnline(io, socket, userId);

    socket.on('update_location', (data) => {
      connectionHandler.handleUpdateLocation(io, socket, userId, data);
    });

    socket.on('set_discoverable', (isDiscoverable) => {
      connectionHandler.handleSetDiscoverable(io, socket, userId, isDiscoverable);
    });

    socket.on('send_connection_request', (data) => {
      connectionHandler.handleSendConnectionRequest(io, socket, userId, data);
    });

    socket.on('accept_connection', (data) => {
      connectionHandler.handleAcceptConnection(io, socket, userId, data);
    });

    socket.on('reject_connection', (data) => {
      connectionHandler.handleRejectConnection(io, socket, userId, data);
    });

    socket.on('send_message', (data) => {
      messageHandler.handleSendMessage(io, socket, userId, data);
    });

    socket.on('typing', (data) => {
      messageHandler.handleTyping(io, socket, userId, data);
    });

    socket.on('stop_typing', (data) => {
      messageHandler.handleStopTyping(io, socket, userId, data);
    });

    socket.on('mark_as_read', (data) => {
      messageHandler.handleMarkAsRead(io, socket, userId, data);
    });

    socket.on('disconnect', async (reason) => {
      console.log(`User disconnected: ${socket.user.name} (${reason})`);
      await connectionHandler.handleDisconnect(io, socket);
    });
  });
};