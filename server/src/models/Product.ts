import mongoose from 'mongoose';
import type { IGeoPoint } from './User.js';

export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  unit: string;
  images: string[];
  imageUrl?: string;
  farmerId: string;
  farmerName?: string;
  location: string;
  geoLocation?: IGeoPoint;
  isAvailable: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const geoPointSchema = new mongoose.Schema<IGeoPoint>(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]) => value.length === 2,
        message: 'Geo coordinates must contain [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  images: [{ type: String }],
  imageUrl: { type: String },
  farmerId: { type: String, required: true },
  farmerName: { type: String },
  location: { type: String, required: true },
  geoLocation: { type: geoPointSchema, required: false },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ geoLocation: '2dsphere' });

export const Product = mongoose.model<IProduct>('Product', productSchema);


