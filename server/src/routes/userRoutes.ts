import express from 'express';
import {
  deleteUser,
  getAllUsers,
  getUserById,
  getUserStats,
  updateUserRole,
} from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// All user routes require admin role
router.use(authenticateToken, requireRole(['admin']));

router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUserById);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
