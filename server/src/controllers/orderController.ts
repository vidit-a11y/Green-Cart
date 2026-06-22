import type { Request, Response } from 'express';
import * as orderService from '../services/orderService.js';
import { sendError, sendSuccess } from '../utils/response.utils.js';

/**
 * Order Controller — HTTP Layer Only
 *
 * PREVIOUSLY: This was a stub returning hardcoded empty data.
 * NOW: Fully implemented, delegates to orderService.ts
 *
 * All order operations require authentication (authenticateToken middleware).
 */

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const consumerId = (req as any).userId;
    const {
      items,
      deliveryAddress,
      paymentMethod,
      customerLocation,
      customerLat,
      customerLng,
    } = req.body;

    // Enhanced logging for debugging
    console.log('📦 CREATE ORDER REQUEST:');
    console.log('consumerId:', consumerId);
    console.log('items:', JSON.stringify(items, null, 2));
    console.log('deliveryAddress:', deliveryAddress);
    console.log('paymentMethod:', paymentMethod);
    console.log('customerLocation:', customerLocation);
    console.log('customerLat:', customerLat, 'customerLng:', customerLng);

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ Validation failed: items missing or empty');
      sendError(res, 'Order must contain at least one item', 400);
      return;
    }

    // Accept either flat { customerLat, customerLng } or GeoJSON { customerLocation }
    const resolvedLocation =
      customerLocation ??
      (customerLat !== undefined && customerLng !== undefined
        ? { type: 'Point', coordinates: [Number(customerLng), Number(customerLat)] }
        : undefined);

    if (!resolvedLocation) {
      console.error('❌ Validation failed: customerLocation missing');
      sendError(res, 'Customer location is required (customerLocation or customerLat+customerLng)', 400);
      return;
    }

    console.log('✅ Validation passed, creating order...');
    const order = await orderService.createOrder({
      consumerId,
      items,
      deliveryAddress,
      paymentMethod,
      customerLocation: resolvedLocation,
    });

    console.log('✅ Order created successfully:', order._id);
    sendSuccess(res, order, 201);
  } catch (error) {
    console.error('❌ Order creation error:', error);
    const message = error instanceof Error ? error.message : 'Error creating order';
    sendError(res, message, 400);
  }
};

export const getDeliveryQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, customerLocation, customerLat, customerLng } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      sendError(res, 'Order must contain at least one item', 400);
      return;
    }

    // Validate that lat and lng are valid numbers if provided
    if (customerLat !== undefined && customerLng !== undefined) {
      const lat = Number(customerLat);
      const lng = Number(customerLng);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        sendError(res, 'Invalid customerLat or customerLng values provided', 400);
        return;
      }
    }

    // Accept either GeoJSON { customerLocation } or valid { customerLat, customerLng }
    const resolvedLocation =
      customerLocation && customerLocation.coordinates && customerLocation.coordinates.length === 2
        ? customerLocation
        : (customerLat !== undefined && customerLng !== undefined && !isNaN(Number(customerLat)) && !isNaN(Number(customerLng))
          ? { type: 'Point', coordinates: [Number(customerLng), Number(customerLat)] }
          : undefined);

    if (!resolvedLocation) {
      sendError(res, 'Customer location is required (customerLocation or valid customerLat+customerLng)', 400);
      return;
    }

    const quote = await orderService.getDeliveryQuote(items, resolvedLocation);
    sendSuccess(res, quote);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error calculating delivery';
    sendError(res, message, 400);
  }
};

export const getConsumerOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const consumerId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await orderService.getOrdersByConsumer(consumerId, page, limit);
    sendSuccess(res, result);
  } catch (error) {
    sendError(res, 'Error fetching orders');
  }
};

/** GET /api/orders/my-orders — all orders for logged-in consumer, newest first */
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const consumerId = (req as any).userId;
    const result = await orderService.getOrdersByConsumer(consumerId, 1, 100);
    sendSuccess(res, result.data);
  } catch (error) {
    sendError(res, 'Error fetching orders');
  }
};

export const getFarmerOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const farmerId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await orderService.getOrdersByFarmer(farmerId, page, limit);
    sendSuccess(res, result);
  } catch (error) {
    sendError(res, 'Error fetching farmer orders');
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await orderService.getAllOrders(page, limit);
    sendSuccess(res, result);
  } catch (error) {
    sendError(res, 'Error fetching all orders');
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    sendSuccess(res, order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching order';
    sendError(res, message, message === 'Order not found' ? 404 : 500);
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).userId;
    const requesterRole = (req as any).userRole || 'consumer';
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      requesterId,
      requesterRole
    );
    sendSuccess(res, order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error updating order status';
    sendError(res, message, 400);
  }
};

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).userId;
    const order = await orderService.cancelOrder(req.params.id, requesterId);
    sendSuccess(res, order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error cancelling order';
    sendError(res, message, 400);
  }
};
