import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
  },
  ip: {
    type: String,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index for auto-cleanup
  },
  revoked: {
    type: Boolean,
    default: false,
  },
  revokedAt: {
    type: Date,
  },
  replacedBy: {
    type: String, // token hash of the new token that replaced this one
  },
}, {
  timestamps: true,
});

refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

export default mongoose.model('RefreshToken', refreshTokenSchema);