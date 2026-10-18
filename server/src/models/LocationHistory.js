import mongoose from 'mongoose';

const locationHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
  accuracy: {
    type: Number,
    default: null,
  },
  altitude: {
    type: Number,
    default: null,
  },
  speed: {
    type: Number,
    default: null,
  },
  heading: {
    type: Number,
    default: null,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for time-based queries per user
locationHistorySchema.index({ user: 1, timestamp: -1 });

// TTL index - auto-delete location history after 30 days
locationHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('LocationHistory', locationHistorySchema);