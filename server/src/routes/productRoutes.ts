import express from 'express';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getLocations,
  getProductById,
  getProducts,
  getProductsByFarmer,
  updateProduct,
} from '../controllers/productController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validateProduct } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/locations', getLocations);
router.get('/:id', getProductById);
router.get('/farmer/:farmerId', getProductsByFarmer);

// Protected routes (require authentication)
router.post('/', authenticateToken, requireRole(['farmer', 'admin']), validateProduct, createProduct);
router.put('/:id', authenticateToken, requireRole(['farmer', 'admin']), validateProduct, updateProduct);
router.delete('/:id', authenticateToken, requireRole(['farmer', 'admin']), deleteProduct);

export default router;
