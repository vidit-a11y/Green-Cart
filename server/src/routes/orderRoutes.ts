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
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validateOrder } from '../middlewares/validate.middleware.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

router.post('/quote', requireRole(['consumer', 'admin']), getDeliveryQuote);
router.post('/', requireRole(['consumer', 'admin']), validateOrder, createOrder);
router.get('/my-orders', getMyOrders);                                      // consumer order history
router.get('/consumer', getConsumerOrders);
router.get('/farmer', requireRole(['farmer', 'admin']), getFarmerOrders);
router.get('/', requireRole(['admin']), getAllOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', requireRole(['farmer', 'admin']), updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);

export default router;
