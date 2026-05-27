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
    const { items, deliveryAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      sendError(res, 'Order must contain at least one item', 400);
      return;
    }

    const order = await orderService.createOrder({
      consumerId,
      items,
      deliveryAddress,
      paymentMethod,
    });

    sendSuccess(res, order, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error creating order';
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
