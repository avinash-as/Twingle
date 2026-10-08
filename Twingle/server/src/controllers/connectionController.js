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

    res.status(201).json({ connectionId: connection._id, message: 'Connection request sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const connections = await Connection.find({
      receiver: req.user._id,
      status: 'pending',
    }).populate('sender', 'name avatar bio');

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

    res.json(requests);
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

    const io = req.app.get('io');
    io.to(connection.sender.toString()).emit('connection_rejected', {
      connectionId: connection._id,
    });

    res.json({ message: 'Connection rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};