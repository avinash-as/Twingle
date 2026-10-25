import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  photos: {
    type: [String],
    default: [],
    validate: {
      validator: (arr) => arr.length <= 6,
      message: 'Cannot have more than 6 photos',
    },
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: '',
  },
  // Verification badge
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationBadge: {
    type: String,
    enum: ['none', 'email', 'phone', 'social', 'identity'],
    default: 'none',
  },
  // Legacy lat/lng fields (kept for backward compatibility)
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  // New GeoJSON Point for 2dsphere index
  locationGeo: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - GeoJSON order!
      default: undefined,
      index: '2dsphere',
    },
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  isDiscoverable: {
    type: Boolean,
    default: true,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  socketId: {
    type: String,
    default: null,
  },
  // Discovery preferences
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say',
  },
  age: {
    type: Number,
    min: 18,
    max: 120,
    default: null,
  },
  interests: {
    type: [String],
    default: [],
    validate: {
      validator: (arr) => arr.length <= 10,
      message: 'Cannot have more than 10 interests',
    },
  },
  genderPreference: {
    type: String,
    enum: ['male', 'female', 'other', 'any', 'prefer_not_to_say'],
    default: 'any',
  },
  agePreferenceMin: {
    type: Number,
    min: 18,
    max: 120,
    default: 18,
  },
  agePreferenceMax: {
    type: Number,
    min: 18,
    max: 120,
    default: 120,
  },
}, {
  timestamps: true,
});

// 2dsphere index for geospatial queries
userSchema.index({ locationGeo: '2dsphere' });

// Compound index for common queries
userSchema.index({ isOnline: 1, isDiscoverable: 1, 'locationGeo.coordinates': '2dsphere' });
userSchema.index({ isOnline: 1, isDiscoverable: 1, lastSeen: -1 });

// Sync legacy location to GeoJSON on save
userSchema.pre('save', function (next) {
  // Sync location -> locationGeo
  if (this.isModified('location.latitude') || this.isModified('location.longitude')) {
    const { latitude, longitude } = this.location;
    if (latitude != null && longitude != null) {
      this.locationGeo = {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
      };
    } else {
      this.locationGeo = undefined;
    }
  }
  
  // Sync locationGeo -> location (for backward compatibility)
  if (this.isModified('locationGeo.coordinates')) {
    const coords = this.locationGeo?.coordinates;
    if (coords && coords.length === 2) {
      this.location = {
        latitude: coords[1],
        longitude: coords[0],
      };
    }
  }

  // Ensure locationGeo is always valid for the 2dsphere index.
  // Repair legacy/bad data (e.g. { type: 'Point' } without coordinates)
  // so saves/updates do not fail with "Can't extract geo keys".
  if (!this.locationGeo || !Array.isArray(this.locationGeo.coordinates) || this.locationGeo.coordinates.length !== 2) {
    const { latitude, longitude } = this.location || {};
    if (latitude != null && longitude != null) {
      this.locationGeo = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    } else {
      this.locationGeo = undefined;
    }
  }

  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.socketId;
  return user;
};

/**
 * Update user location with both legacy and GeoJSON formats
 */
userSchema.methods.updateLocation = function (latitude, longitude) {
  this.location = { latitude, longitude };
  this.locationGeo = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  this.lastSeen = new Date();
  return this.save();
};

export default mongoose.model('User', userSchema);