import mongoose from 'mongoose';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: 'farmer' | 'consumer' | 'admin';
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  role: { type: String, enum: ['farmer', 'consumer', 'admin'], default: 'consumer' },
  phone: { type: String },
  address: { type: String },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);
