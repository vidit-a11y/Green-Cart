import mongoose from 'mongoose';
import type { IGeoPoint } from './User.js';

/**
 * Order Model
 *
 * Represents a purchase transaction between a consumer and a farmer.
 * Each order contains line items (products + quantities), delivery info,
 * payment method, and a status lifecycle.
 *
 * Status lifecycle:
 *   pending → confirmed → shipped → delivered
 *                ↓
 *            cancelled (from any state before delivered)
 */

export interface IOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface IOrder {
  _id?: string;
  consumerId: string;
  farmerId?: string;
  farmerName?: string;
  items: IOrderItem[];
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  distanceKm?: number;
  deliveryDistanceKm?: number;
  farmerLocationLabel?: string;
  customerLocation?: IGeoPoint;
  farmerLocation?: IGeoPoint;
  minimumOrderMet: boolean;
 // Simulated delivery rider fields

assignedRider?: string;

riderName?: string;

riderPhone?: string;

riderVehicle?: string;

riderVehicleNumber?: string;

riderRating?: number;

riderPhoto?: string;

simulationStartTime?: Date;

estimatedMinutes?: number;

deliveryStatus:

  | 'pending'

  | 'farmer_accepted'

  | 'picked_up'

  | 'in_transit'

  | 'delivered';

estimatedDeliveryTime?: Date;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: string;
  // Razorpay payment fields
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  razorpayOrderId?: string;
  paidAt?: Date;
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
        message: 'Customer coordinates must contain [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false } // sub-documents don't need their own _id
);

const orderSchema = new mongoose.Schema<IOrder>(
  {
    consumerId: { type: String, required: true, index: true },
    farmerId: { type: String, index: true },
    farmerName: { type: String },
    items: { type: [orderItemSchema], required: true },
    subtotalAmount: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    distanceKm: { type: Number },
    deliveryDistanceKm: { type: Number },
    farmerLocationLabel: { type: String },
    customerLocation: { type: geoPointSchema, required: false },
    farmerLocation: { type: geoPointSchema, required: false },
    minimumOrderMet: { type: Boolean, required: true, default: false },
    // Simulated delivery rider
    assignedRider: { type: String },
    riderName: { type: String },
    riderPhone: { type: String },
    riderVehicle: { type: String },
    riderVehicleNumber: { type: String },
    riderRating: { type: Number },
    riderPhoto: { type: String },
    simulationStartTime: { type: Date },
    estimatedMinutes: { type: Number },

    deliveryStatus: {
      type: String,
      enum: ['pending', 'farmer_accepted', 'picked_up', 'in_transit', 'delivered'],
      default: 'pending',
      index: true,
    },

estimatedDeliveryTime: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    deliveryAddress: { type: String, required: true },
    paymentMethod: { type: String, required: true, default: 'cod' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentId: { type: String },
    razorpayOrderId: { type: String },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
