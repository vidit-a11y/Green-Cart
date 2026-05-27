import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { sendError, sendSuccess } from '../utils/response.utils.js';

/**
 * User Controller — Admin User Management
 *
 * NEW FILE: Previously the frontend's userService.ts called /users endpoints
 * that didn't exist on the backend. This controller implements them.
 *
 * All routes here require admin role (enforced via requireRole middleware in routes).
 */

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    sendSuccess(res, { data: users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch {
    sendError(res, 'Error fetching users');
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) { sendError(res, 'User not found', 404); return; }
    sendSuccess(res, user);
  } catch {
    sendError(res, 'Error fetching user');
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const validRoles = ['farmer', 'consumer', 'admin'];

    if (!validRoles.includes(role)) {
      sendError(res, 'Invalid role', 400);
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) { sendError(res, 'User not found', 404); return; }
    sendSuccess(res, user);
  } catch {
    sendError(res, 'Error updating user role');
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) { sendError(res, 'User not found', 404); return; }
    sendSuccess(res, { message: 'User deleted successfully' });
  } catch {
    sendError(res, 'Error deleting user');
  }
};

export const getUserStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, farmers, consumers, admins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'consumer' }),
      User.countDocuments({ role: 'admin' }),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

    sendSuccess(res, { totalUsers: total, farmers, consumers, admins, newUsersThisMonth });
  } catch {
    sendError(res, 'Error fetching user stats');
  }
};
