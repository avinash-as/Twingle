import User from '../models/User.js';
import Connection from '../models/Connection.js';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: { latitude, longitude },
        lastSeen: new Date(),
      },
      { new: true }
    );

    res.json({
      message: 'Location updated',
      location: user.location,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const maxDist = parseInt(maxDistance);

    const currentUser = await User.findById(req.user._id);

    const users = await User.find({
      _id: { $ne: req.user._id },
      isOnline: true,
      isDiscoverable: true,
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null },
    }).select('name avatar bio location isOnline isDiscoverable lastSeen');

    const nearbyUsers = users
      .map((user) => {
        const distance = calculateDistance(
          userLat,
          userLon,
          user.location.latitude,
          user.location.longitude
        );

        if (distance <= maxDist) {
          return {
            id: user._id,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
            distance,
            distanceFormatted: formatDistance(distance),
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearbyUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const connection = await Connection.findOne({
      $or: [
        { sender: req.user._id, receiver: req.params.id },
        { sender: req.params.id, receiver: req.user._id },
      ],
    });

    res.json({
      ...user.getPublicProfile(),
      connectionStatus: connection ? connection.status : null,
      isSender: connection ? connection.sender.toString() === req.user._id.toString() : false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, bio, isDiscoverable } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar, bio, isDiscoverable },
      { new: true, runValidators: true }
    );

    res.json(user.getPublicProfile());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setDiscoverable = async (req, res) => {
  try {
    const { isDiscoverable } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isDiscoverable },
      { new: true }
    );

    res.json({ isDiscoverable: user.isDiscoverable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getConnectedUsers = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      status: 'accepted',
    }).populate('sender receiver', 'name avatar bio isOnline lastSeen');

    const connectedUsers = connections.map((conn) => {
      const otherUser = conn.sender._id.toString() === req.user._id.toString() ? conn.receiver : conn.sender;
      return {
        id: otherUser._id,
        name: otherUser.name,
        avatar: otherUser.avatar,
        bio: otherUser.bio,
        isOnline: otherUser.isOnline,
        lastSeen: otherUser.lastSeen,
      };
    });

    res.json(connectedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};