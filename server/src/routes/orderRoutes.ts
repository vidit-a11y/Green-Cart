import express from 'express';
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getConsumerOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

router.post('/', createOrder);                                              // consumer creates order
router.get('/consumer', getConsumerOrders);                                 // consumer views their orders
router.get('/farmer', requireRole(['farmer', 'admin']), getFarmerOrders);   // farmer views their orders
router.get('/', requireRole(['admin']), getAllOrders);                       // admin views all orders
router.get('/:id', getOrderById);                                           // any auth user views one order
router.patch('/:id/status', requireRole(['farmer', 'admin']), updateOrderStatus); // farmer/admin updates status
router.patch('/:id/cancel', cancelOrder);                                   // consumer cancels their order

export default router;
