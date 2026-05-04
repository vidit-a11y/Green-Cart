import express from 'express';
import { getOrdersByFarmer } from '../controllers/orderController.js';

const router = express.Router();

router.get('/farmer', getOrdersByFarmer);

export default router;
