import User from '../models/User.js';
import Connection from '../models/Connection.js';
import LocationHistory from '../models/LocationHistory.js';
import { AppError, ERROR_CODES, asyncHandler } from '../utils/errors.js';

const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

export const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  // Use the new model method that syncs both formats
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
  }

  await user.updateLocation(latitude, longitude);

  res.json({
    message: 'Location updated',
    location: user.location,
  });
});

export const batchLocation = asyncHandler(async (req, res) => {
  const { locations } = req.body;
  const userId = req.user._id;

  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Locations array is required', 400);
  }

  if (locations.length > 100) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Maximum 100 locations per batch', 400);
  }

  // Validate all locations
  for (const loc of locations) {
    if (loc.latitude == null || loc.longitude == null ||
        loc.latitude < -90 || loc.latitude > 90 ||
        loc.longitude < -180 || loc.longitude > 180) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid location coordinates', 400);
    }
  }

  // Create location history records
  const historyRecords = locations.map(loc => ({
    user: userId,
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy: loc.accuracy || null,
    altitude: loc.altitude || null,
    speed: loc.speed || null,
    heading: loc.heading || null,
    timestamp: loc.timestamp ? new Date(loc.timestamp) : new Date(),
  }));

  await LocationHistory.insertMany(historyRecords);

  // Update current location to the most recent one
  const latest = locations[locations.length - 1];
  const user = await User.findById(userId);
  if (user) {
    await user.updateLocation(latest.latitude, latest.longitude);
  }

  res.json({
    message: 'Batch location updated',
    count: locations.length,
    latestLocation: {
      latitude: latest.latitude,
      longitude: latest.longitude,
    },
  });
});

export const getNearbyUsers = asyncHandler(async (req, res) => {
  const { latitude, longitude, maxDistance = 5000, page = 1, limit = 20 } = req.query;
  const { gender, ageMin, ageMax, interests, genderPreference } = req.query;

  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);
  const maxDist = parseInt(maxDistance);
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Validate coordinates
  if (isNaN(userLat) || isNaN(userLon) || userLat < -90 || userLat > 90 || userLon < -180 || userLon > 180) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid coordinates', 400);
  }

  // Build discovery filter query
  const discoveryFilter = {
    _id: { $ne: req.user._id },
    isOnline: true,
    isDiscoverable: true,
    locationGeo: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [userLon, userLat],
        },
        $maxDistance: maxDist,
        $minDistance: 0,
      },
    },
  };

  // Gender filter
  if (gender) {
    discoveryFilter.gender = gender;
  }

  // Age range filter
  if (ageMin || ageMax) {
    discoveryFilter.age = {};
    if (ageMin) discoveryFilter.age.$gte = parseInt(ageMin);
    if (ageMax) discoveryFilter.age.$lte = parseInt(ageMax);
  }

  // Interests filter (users with at least one matching interest)
  if (interests) {
    const interestsArray = Array.isArray(interests) ? interests : [interests];
    discoveryFilter.interests = { $in: interestsArray };
  }

  // Get current user's preferences if no explicit filters provided
  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
  }

  // Apply gender preference if no explicit gender filter
  if (!gender && currentUser.genderPreference && currentUser.genderPreference !== 'any') {
    discoveryFilter.gender = currentUser.genderPreference;
  }

  // Apply age preference if no explicit age filter
  if (!ageMin && !ageMax && currentUser.agePreferenceMin && currentUser.agePreferenceMax) {
    discoveryFilter.age = {
      $gte: currentUser.agePreferenceMin,
      $lte: currentUser.agePreferenceMax,
    };
  }

  // Use MongoDB $near with 2dsphere index - much more efficient!
  // Note: GeoJSON coordinates are [longitude, latitude]
  const users = await User.find(discoveryFilter)
    .select('name avatar bio location locationGeo isOnline isDiscoverable lastSeen gender age interests')
    .skip(skip)
    .limit(limitNum)
    .lean(); // Use lean() for better performance

  // Get total count for pagination (separate query for efficiency)
  const total = await User.countDocuments(discoveryFilter);

  // Format response with calculated distances
  const nearbyUsers = users.map((user) => {
    // Calculate distance from $near metadata or compute
    // Since we're using $near, results are already sorted by distance
    // We can compute distance for display
    const coords = user.locationGeo?.coordinates || [user.location?.longitude, user.location?.latitude];
    let distance = 0;
    
    if (coords && coords.length === 2) {
      // Use Haversine for display distance
      const R = 6371e3;
      const φ1 = (userLat * Math.PI) / 180;
      const φ2 = (coords[1] * Math.PI) / 180;
      const Δφ = ((coords[1] - userLat) * Math.PI) / 180;
      const Δλ = ((coords[0] - userLon) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = Math.round(R * c);
    }

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
  });

  res.json({
    users: nearbyUsers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
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
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar, bio, isDiscoverable } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, avatar, bio, isDiscoverable },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
  }

  res.json(user.getPublicProfile());
});

export const setDiscoverable = asyncHandler(async (req, res) => {
  const { isDiscoverable } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { isDiscoverable },
    { new: true }
  );

  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User not found', 404);
  }

  res.json({ isDiscoverable: user.isDiscoverable });
});

export const getConnectedUsers = asyncHandler(async (req, res) => {
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
});