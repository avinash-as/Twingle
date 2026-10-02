import Message from '../models/Message.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    const connection = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: 'accepted',
    });

    if (!connection) {
      return res.status(403).json({ message: 'Not connected to this user' });
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message,
    });

    const populatedMessage = await Message.findById(newMessage._id).populate(
      'sender',
      'name avatar'
    );

    req.io.to(receiverId.toString()).emit('receive_message', {
      message: populatedMessage,
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const connection = await Connection.findOne({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
      status: 'accepted',
    });

    if (!connection) {
      return res.status(403).json({ message: 'Not connected to this user' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      status: 'accepted',
    }).populate('sender receiver', 'name avatar isOnline lastSeen');

    const conversations = await Promise.all(
      connections.map(async (conn) => {
        const otherUser = conn.sender._id.toString() === req.user._id.toString() ? conn.receiver : conn.sender;

        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.user._id, receiver: otherUser._id },
            { sender: otherUser._id, receiver: req.user._id },
          ],
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          sender: otherUser._id,
          receiver: req.user._id,
          read: false,
        });

        return {
          user: {
            id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar,
            isOnline: otherUser.isOnline,
            lastSeen: otherUser.lastSeen,
          },
          lastMessage: lastMessage
            ? {
                message: lastMessage.message,
                createdAt: lastMessage.createdAt,
                sender: lastMessage.sender,
              }
            : null,
          unreadCount,
        };
      })
    );

    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};