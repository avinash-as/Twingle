import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

connectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });
connectionSchema.index({ receiver: 1, status: 1, createdAt: -1 });
connectionSchema.index({ sender: 1, status: 1, createdAt: -1 });

export default mongoose.model('Connection', connectionSchema);