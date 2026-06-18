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

// ==================== ADDRESS MANAGEMENT ====================

export const getSavedAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId).select('savedAddresses');
    if (!user) { sendError(res, 'User not found', 404); return; }
    sendSuccess(res, user.savedAddresses || []);
  } catch {
    sendError(res, 'Error fetching saved addresses');
  }
};

export const addSavedAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { label, addressLine, city, state, pincode, coordinates, isDefault } = req.body;

    // Validation
    if (!label || !addressLine || !city || !state || !pincode || !coordinates) {
      sendError(res, 'Missing required address fields', 400);
      return;
    }

    if (!['Home', 'Work', 'Other'].includes(label)) {
      sendError(res, 'Invalid label. Must be Home, Work, or Other', 400);
      return;
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      sendError(res, 'Coordinates must be [lng, lat]', 400);
      return;
    }

    const user = await User.findById(userId);
    if (!user) { sendError(res, 'User not found', 404); return; }

    // If this is being set as default, unset other defaults
    if (isDefault) {
      user.savedAddresses = user.savedAddresses?.map((addr: any) => ({
        ...addr,
        isDefault: false,
      })) || [];
    }

    // Add new address
    const newAddress = {
      label,
      addressLine,
      city,
      state,
      pincode,
      coordinates,
      isDefault: isDefault || false,
    };

    user.savedAddresses = user.savedAddresses || [];
    user.savedAddresses.push(newAddress as any);
    await user.save();

    // Get the newly added address (last one)
    const savedAddress = user.savedAddresses[user.savedAddresses.length - 1];
    sendSuccess(res, savedAddress, 201);
  } catch (error) {
    console.error('Add address error:', error);
    sendError(res, 'Error adding address');
  }
};

export const updateSavedAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const addressId = req.params.id;
    const { label, addressLine, city, state, pincode, coordinates, isDefault } = req.body;

    const user = await User.findById(userId);
    if (!user) { sendError(res, 'User not found', 404); return; }

    const address = user.savedAddresses?.find((addr: any) => addr._id?.toString() === addressId);
    if (!address) { sendError(res, 'Address not found', 404); return; }

    // If setting as default, unset others
    if (isDefault) {
      user.savedAddresses = user.savedAddresses?.map((addr: any) => ({
        ...addr,
        isDefault: addr._id?.toString() === addressId,
      })) || [];
    }

    // Update the address
    const addressIndex = user.savedAddresses?.findIndex((addr: any) => addr._id?.toString() === addressId);
    if (addressIndex !== undefined && addressIndex >= 0 && user.savedAddresses) {
      const currentAddr = user.savedAddresses[addressIndex] as any;
      user.savedAddresses[addressIndex] = {
        _id: currentAddr._id,
        label: label || currentAddr.label,
        addressLine: addressLine || currentAddr.addressLine,
        city: city || currentAddr.city,
        state: state || currentAddr.state,
        pincode: pincode || currentAddr.pincode,
        coordinates: coordinates || currentAddr.coordinates,
        isDefault: isDefault !== undefined ? isDefault : currentAddr.isDefault,
      } as any;
    }

    await user.save();
    sendSuccess(res, user.savedAddresses?.[addressIndex || 0]);
  } catch {
    sendError(res, 'Error updating address');
  }
};

export const deleteSavedAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const addressId = req.params.id;

    const user = await User.findById(userId);
    if (!user) { sendError(res, 'User not found', 404); return; }

    user.savedAddresses = user.savedAddresses?.filter((addr: any) => addr._id?.toString() !== addressId) || [];
    await user.save();

    sendSuccess(res, { message: 'Address deleted successfully' });
  } catch {
    sendError(res, 'Error deleting address');
  }
};

export const setDefaultAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const addressId = req.params.id;

    const user = await User.findById(userId);
    if (!user) { sendError(res, 'User not found', 404); return; }

    // Unset all defaults, then set the selected one
    user.savedAddresses = user.savedAddresses?.map((addr: any) => ({
      ...addr,
      isDefault: addr._id?.toString() === addressId,
    })) || [];

    await user.save();
    sendSuccess(res, { message: 'Default address updated' });
  } catch {
    sendError(res, 'Error setting default address');
  }
};
