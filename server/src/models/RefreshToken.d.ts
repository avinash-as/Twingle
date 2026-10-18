// Type declarations for RefreshToken model

import { Document, Model, Types } from 'mongoose';

export interface RefreshTokenDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  userAgent: string | undefined;
  ip: string | undefined;
  expiresAt: Date;
  revoked: boolean;
  revokedAt: Date | undefined;
  replacedBy: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenModel extends Model<RefreshTokenDocument> {
  // Static methods
}

declare const RefreshToken: RefreshTokenModel;
export default RefreshToken;