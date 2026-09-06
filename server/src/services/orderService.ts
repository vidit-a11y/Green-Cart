import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import {
  buildDeliveryQuote,
  MIN_ORDER_VALUE,
  normalizeCoordinates,
  toGeoPoint,
} from './deliveryService.js';
import { createPorterOrder, getPorterQuote } from './porter.service.js';

/** Explicit fee rule per Step 3: free within 7.5 km, ₹50 beyond */
const calcDeliveryFee = (distanceKm: number): number => (distanceKm <= 7.5 ? 0 : 50);

interface CreateOrderData {
  consumerId: string;
  items: { productId: string; quantity: number }[];
  deliveryAddress: string;
  paymentMethod: string;
  customerLocation: { coordinates: [number, number] };
}

const parseDeliveryContact = (deliveryAddress: string) => {
  const lines = deliveryAddress
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const phoneMatch = deliveryAddress.match(/Phone:\s*([+\d\s-]+)/i);

  return {
    name: lines[0] || 'Customer',
    phone: phoneMatch?.[1]?.trim() || '',
  };
};

const buildItemDescription = (items: { productName: string; quantity: number; unit: string }[]) =>
  items.map((item) => `${item.productName} x${item.quantity} ${item.unit}`).join(', ');

export const createOrder = async (data: CreateOrderData) => {
  const { consumerId, items, deliveryAddress, paymentMethod, customerLocation } = data;
  const normalizedCoords = normalizeCoordinates(customerLocation);

  if (!normalizedCoords) {
    throw new Error('Valid customer coordinates are required');
  }

  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== items.length) {
    throw new Error('One or more products not found');
  }

  // Validate stock availability BEFORE creating order
  for (const item of items) {
    const product = products.find((entry) => entry._id?.toString() === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (!product.isAvailable) {
      throw new Error(`${product.name} is not available`);
    }
    
    const availableStock = product.quantity ?? 0;
    if (availableStock < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${availableStock} ${product.unit}s, Requested: ${item.quantity}`
      );
    }
  }

  const orderItems = items.map((item) => {
    const product = products.find((entry) => entry._id?.toString() === item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);

    return {
      productId: item.productId,
      productName: product.name,
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
    };
  });

  // Minimum order guard — explicit check per Step 3 spec
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal < MIN_ORDER_VALUE) {
    throw new Error(`Minimum order ₹${MIN_ORDER_VALUE} required`);
  }

  const quote = await buildDeliveryQuote(normalizedCoords, items);
  const porterQuote = await getPorterQuote(quote.farmerCoordinates, normalizedCoords);
  const estimatedDeliveryTime = new Date(
    Date.now() + Math.max(45, porterQuote.etaMinutes || Math.ceil(quote.distanceKm * 12)) * 60 * 1000
  );

  // Explicit delivery fee override per Step 3 spec
  const deliveryFee = calcDeliveryFee(quote.distanceKm);
  const totalAmount = quote.subtotalAmount + deliveryFee;

  const order = await Order.create({
    consumerId,
    farmerId: quote.farmerId,
    farmerName: quote.farmerName,
    items: orderItems,
    subtotalAmount: quote.subtotalAmount,
    deliveryFee,
    totalAmount,
    distanceKm: quote.distanceKm,
    deliveryDistanceKm: quote.distanceKm,
    farmerLocationLabel: quote.farmerLocation,
    customerLocation: toGeoPoint(normalizedCoords),
    farmerLocation: toGeoPoint(quote.farmerCoordinates),
    minimumOrderMet: quote.minimumOrderMet,
    deliveryStatus: 'pending',
    estimatedDeliveryTime,
    deliveryAddress,
    paymentMethod,
    status: 'pending',
  });

  // Decrease stock for each ordered item
  console.log('📦 Decreasing stock for ordered items...');
  for (const item of items) {
    const result = await Product.findByIdAndUpdate(
      item.productId,
      { 
        $inc: { quantity: -item.quantity },
      },
      { new: true }
    );
    
    if (result) {
      console.log(`✅ Stock updated for ${result.name}: ${result.quantity} ${result.unit}s remaining`);
      
      // If stock reaches 0, mark as unavailable
      if (result.quantity <= 0) {
        await Product.findByIdAndUpdate(item.productId, { isAvailable: false });
        console.log(`⚠️ ${result.name} is now out of stock`);
      }
    }
  }

  return order;
};

export const getDeliveryQuote = async (
  items: { productId: string; quantity: number }[],
  customerLocation: { coordinates: [number, number] }
) => {
  const normalizedCoords = normalizeCoordinates(customerLocation);

  if (!normalizedCoords) {
    throw new Error('Valid customer coordinates are required');
  }

  return buildDeliveryQuote(normalizedCoords, items);
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

  if (requesterRole !== 'admin' && order.farmerId !== requesterId) {
    throw new Error('Not authorized to update this order');
  }

  if (status === 'confirmed') {
    if (!order.customerLocation?.coordinates) {
      throw new Error('Customer delivery location is missing');
    }

    const farmer = order.farmerId
      ? await User.findById(order.farmerId).select('name phone address location')
      : null;
    const consumer = await User.findById(order.consumerId).select('name phone address');

    const farmerCoords = order.farmerLocation?.coordinates || farmer?.location?.coordinates;
    if (!farmer || !farmerCoords) {
      throw new Error('Farmer location is missing');
    }

    if (order.porterOrderId) {
      order.status = 'confirmed';
      order.deliveryStatus = order.deliveryStatus === 'pending' ? 'porter_assigned' : order.deliveryStatus;
      await order.save();
      return order;
    }

    const deliveryContact = parseDeliveryContact(order.deliveryAddress);
    const porterOrder = await createPorterOrder({
      orderId: order.id || order._id!.toString(),
      pickupAddress: order.farmerLocationLabel || farmer.address || 'Farmer pickup location',
      pickupCoords: farmerCoords,
      pickupContactName: farmer.name,
      pickupContactPhone: farmer.phone || '',
      dropAddress: order.deliveryAddress,
      dropCoords: order.customerLocation.coordinates,
      dropContactName: consumer?.name || deliveryContact.name,
      dropContactPhone: consumer?.phone || deliveryContact.phone,
      itemDescription: buildItemDescription(order.items),
      orderValue: order.totalAmount,
    });

    order.porterOrderId = porterOrder.porterOrderId;
    order.porterTrackingUrl = porterOrder.trackingUrl;
    order.deliveryPartnerName = porterOrder.driverName;
    order.deliveryPartnerPhone = porterOrder.driverPhone;
    order.estimatedDeliveryTime = porterOrder.etaMinutes
      ? new Date(Date.now() + porterOrder.etaMinutes * 60 * 1000)
      : order.estimatedDeliveryTime;
    order.farmerLocation = toGeoPoint(farmerCoords);
    order.distanceKm = order.distanceKm ?? order.deliveryDistanceKm;
    order.status = 'confirmed';
    order.deliveryStatus = 'porter_assigned';
    await order.save();
    return order;
  }

  if (status === 'shipped') {
    order.status = 'shipped';
    order.deliveryStatus = order.deliveryStatus === 'picked_up' ? 'picked_up' : 'in_transit';
    await order.save();
    return order;
  }

  if (status === 'delivered') {
    order.status = 'delivered';
    order.deliveryStatus = 'delivered';
    await order.save();
    return order;
  }

  if (status === 'cancelled') {
    order.status = 'cancelled';
    await order.save();
    return order;
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
