import express from 'express';
import type { Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { Order } from '../models/Order.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/payment.service.js';
import { sendError, sendSuccess } from '../utils/response.utils.js';

const router = express.Router();

// All payment routes require auth
router.use(authenticateToken);

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for an existing DB order.
 * Body: { amount: number, orderId: string }
 */
router.post('/create-order', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      sendError(res, 'amount and orderId are required', 400);
      return;
    }

    const rzpOrder = await createRazorpayOrder(Number(amount), String(orderId));

    sendSuccess(res, {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payment order';
    sendError(res, message, 500);
  }
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and marks order as paid.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      sendError(res, 'Missing payment verification fields', 400);
      return;
    }

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      sendError(res, 'Payment verification failed — invalid signature', 400);
      return;
    }

    // Mark order as paid
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paidAt: new Date(),
      paymentMethod: 'razorpay',
    });

    sendSuccess(res, { message: 'Payment verified and order updated' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error verifying payment';
    sendError(res, message, 500);
  }
});

export default router;
