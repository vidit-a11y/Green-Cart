import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

/**
 * Order Service — Business Logic Layer
 *
 * Handles the complete order lifecycle:
 * create → confirm → ship → deliver / cancel
 *
 * This is the most complex service because it touches both
 * Product (to get names/prices) and Order collections.
 */

interface CreateOrderData {
  consumerId: string;
  items: { productId: string; quantity: number }[];
  deliveryAddress: string;
  paymentMethod: string;
}

export const createOrder = async (data: CreateOrderData) => {
  const { consumerId, items, deliveryAddress, paymentMethod } = data;

  // Fetch all products in one query (efficient — no N+1 problem)
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== items.length) {
    throw new Error('One or more products not found');
  }

  // Build order items with product details (snapshot pricing)
  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    if (!product.isAvailable) throw new Error(`${product.name} is not available`);

    return {
      productId: item.productId,
      productName: product.name,
      price: product.price, // snapshot — price at time of order
      quantity: item.quantity,
      unit: product.unit,
    };
  });

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Determine farmerId from first product (simplified — real app would split by farmer)
  const farmerId = products[0]?.farmerId;

  const order = await Order.create({
    consumerId,
    farmerId,
    items: orderItems,
    totalAmount,
    deliveryAddress,
    paymentMethod,
    status: 'pending',
  });

  return order;
};

export const getOrdersByConsumer = async (consumerId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Order.find({ consumerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ consumerId }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getOrdersByFarmer = async (farmerId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Order.find({ farmerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ farmerId }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getAllOrders = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getOrderById = async (id: string) => {
  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');
  return order;
};

export const updateOrderStatus = async (
  id: string,
  status: string,
  requesterId: string,
  requesterRole: string
) => {
  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');

  // Only the farmer or admin can update status
  if (requesterRole !== 'admin' && order.farmerId !== requesterId) {
    throw new Error('Not authorized to update this order');
  }

  order.status = status as any;
  await order.save();
  return order;
};

export const cancelOrder = async (id: string, requesterId: string) => {
  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');

  if (order.consumerId !== requesterId) {
    throw new Error('Not authorized to cancel this order');
  }

  if (['delivered', 'cancelled'].includes(order.status)) {
    throw new Error(`Cannot cancel an order that is already ${order.status}`);
  }

  order.status = 'cancelled';
  await order.save();
  return order;
};
