// Type declarations for Connection model

import { Document, Model, Types } from 'mongoose';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface ConnectionDocument extends Document {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionModel extends Model<ConnectionDocument> {
  // Static methods
}

declare const Connection: ConnectionModel;
export default Connection;