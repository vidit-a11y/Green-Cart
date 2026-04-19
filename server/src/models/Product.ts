import mongoose from 'mongoose';

export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  unit: string;
  images: string[];
  farmerId: string;
  farmerName?: string;
  location: string;
  isAvailable: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  images: [{ type: String }],
  farmerId: { type: String, required: true },
  farmerName: { type: String },
  location: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Product = mongoose.model<IProduct>('Product', productSchema);


