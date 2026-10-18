// Type declarations for User model

import { Document, Model, Types } from 'mongoose';

export interface UserLocation {
  latitude: number | null;
  longitude: number | null;
}

export interface UserLocationGeo {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: string;
  bio: string;
  location: UserLocation;
  locationGeo: UserLocationGeo | null;
  isOnline: boolean;
  isDiscoverable: boolean;
  lastSeen: Date;
  socketId: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(enteredPassword: string): Promise<boolean>;
  getPublicProfile(): Omit<UserDocument, 'password' | 'socketId' | 'comparePassword' | 'getPublicProfile' | 'updateLocation'>;
  updateLocation(latitude: number, longitude: number): Promise<UserDocument>;
}

export interface UserModel extends Model<UserDocument> {
  // Static methods can be added here
}

declare const User: UserModel;
export default User;