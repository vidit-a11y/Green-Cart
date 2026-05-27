import mongoose from 'mongoose';

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
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    deliveryAddress: { type: String, required: true },
    paymentMethod: { type: String, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
