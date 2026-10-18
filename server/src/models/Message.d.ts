// Type declarations for Message model

import { Document, Model, Types } from 'mongoose';

export interface MessageDocument extends Document {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageModel extends Model<MessageDocument> {
  // Static methods
}

declare const Message: MessageModel;
export default Message;