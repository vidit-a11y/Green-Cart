import express from 'express';
import {
  cancelOrder,
  createOrder,
  getDeliveryQuote,
  getAllOrders,
  getConsumerOrders,
  getFarmerOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { Order } from '../models/Order.js';
import { getSimulatedRiderLocation } from '../services/simulationService.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validateOrder } from '../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/quote', requireRole(['consumer', 'admin']), getDeliveryQuote);
router.post('/', requireRole(['consumer', 'admin']), validateOrder, createOrder);
router.get('/my-orders', getMyOrders);                                      // consumer order history
router.get('/consumer', getConsumerOrders);
router.get('/farmer', requireRole(['farmer', 'admin']), getFarmerOrders);
router.get('/', requireRole(['admin']), getAllOrders);
router.get('/:id/rider-location', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Only the customer who owns the order can track the rider.
    if (order.consumerId !== (req as any).userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to track this order',
      });
    }

    if (!order.assignedRider) {
      return res.status(400).json({
        success: false,
        message: 'No delivery rider has been assigned yet',
      });
    }

    const riderLocation = await getSimulatedRiderLocation(order, {
      persist: true,
    });

    return res.json({
      success: true,
      ...riderLocation,
    });
  } catch (error) {
    console.error('Failed to get simulated rider location:', error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to get rider location',
    });
  }
});
router.get('/:id', getOrderById);
router.patch('/:id/status', requireRole(['farmer', 'admin']), updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);

export default router;
