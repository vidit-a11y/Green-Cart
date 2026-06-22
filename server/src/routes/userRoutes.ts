import express from 'express';
import type { Request, Response } from 'express';
import {
  deleteUser,
  getAllUsers,
  getUserById,
  getUserStats,
  updateUserRole,
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
} from '../controllers/userController.js';
import { updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { User } from '../models/User.js';
import { sendError, sendSuccess } from '../utils/response.utils.js';

const router = express.Router();

// ── Self-service routes (any authenticated user) ─────────────────────────────
// PATCH /api/users/profile  — update own profile incl. location { lat, lng }
router.patch('/profile', authenticateToken, updateProfile);

// ── Address Management (consumer/farmer self-service) ────────────────────────
router.get('/addresses', authenticateToken, getSavedAddresses);
router.post('/addresses', authenticateToken, addSavedAddress);
router.put('/addresses/:id', authenticateToken, updateSavedAddress);
router.delete('/addresses/:id', authenticateToken, deleteSavedAddress);
router.put('/addresses/:id/default', authenticateToken, setDefaultAddress);

// ── Farmer Payment Details ────────────────────────────────────────────────────
router.put('/payment-details', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { upiId, accountNumber, ifscCode, accountHolderName, bankName } = req.body;
    await User.findByIdAndUpdate(userId, {
      'paymentDetails.upiId': upiId,
      'paymentDetails.accountNumber': accountNumber,
      'paymentDetails.ifscCode': ifscCode,
      'paymentDetails.accountHolderName': accountHolderName,
      'paymentDetails.bankName': bankName,
    });
    sendSuccess(res, { message: 'Payment details saved' });
  } catch (error) {
    sendError(res, 'Failed to save payment details', 500);
  }
});


// ── Admin-only routes ─────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireRole(['admin']), getAllUsers);
router.get('/stats', authenticateToken, requireRole(['admin']), getUserStats);
router.get('/:id', authenticateToken, requireRole(['admin']), getUserById);
router.patch('/:id/role', authenticateToken, requireRole(['admin']), updateUserRole);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteUser);

export default router;
