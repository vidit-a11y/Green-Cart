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
  updateFarmerProductLocations,
} from '../controllers/productController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { upload } from '../config/cloudinary.config.js';
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
router.post('/', authenticateToken, requireRole(['farmer', 'admin']), upload.single('image'), validateProduct, createProduct);
router.put('/:id', authenticateToken, requireRole(['farmer', 'admin']), upload.single('image'), validateProduct, updateProduct);
router.delete('/:id', authenticateToken, requireRole(['farmer', 'admin']), deleteProduct);

// Update all farmer's products with new location
router.post('/update-locations', authenticateToken, requireRole(['farmer', 'admin']), updateFarmerProductLocations);

export default router;
