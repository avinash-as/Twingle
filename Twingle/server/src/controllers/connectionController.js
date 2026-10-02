import Connection from '../models/Connection.js';
import User from '../models/User.js';

export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: 'Cannot connect to yourself' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        return res.status(400).json({ message: 'Connection request already pending' });
      }
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected' });
      }
    }

    const connection = await Connection.create({
      sender: senderId,
      receiver: receiverId,
      status: 'pending',
    });

    req.io.to(receiver.socketId).emit('connection_request', {
      connectionId: connection._id,
      sender: {
        id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar,
        bio: req.user.bio,
      },
    });

    res.status(201).json({
      message: 'Connection request sent',
      connection,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection already processed' });
    }

    connection.status = 'accepted';
    await connection.save();

    req.io.to(connection.sender.toString()).emit('connection_accepted', {
      connectionId: connection._id,
      receiver: {
        id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar,
        bio: req.user.bio,
      },
    });

    res.json({ message: 'Connection accepted', connection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection already processed' });
    }

    connection.status = 'rejected';
    await connection.save();

    req.io.to(connection.sender.toString()).emit('connection_rejected', {
      connectionId: connection._id,
    });

    res.json({ message: 'Connection rejected', connection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingConnections = async (req, res) => {
  try {
    const pending = await Connection.find({
      receiver: req.user._id,
      status: 'pending',
    }).populate('sender', 'name avatar bio');

    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};