import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/User.js';

type UserRole = 'farmer' | 'consumer' | 'admin';

/**
 * Role-Based Access Control Middleware
 *
 * Must be used AFTER authenticateToken (which sets req.userId).
 * Fetches the user from DB and checks if their role is in the allowed list.
 *
 * Usage: router.delete('/:id', authenticateToken, requireRole(['admin']), deleteUser)
 *
 * Real-world analogy: A security badge check after the front door.
 * authenticateToken = "Are you an employee?" (identity check)
 * requireRole       = "Do you have clearance for this floor?" (authorization check)
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await User.findById(userId).select('role');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!allowedRoles.includes(user.role as UserRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        });
        return;
      }

      // Attach role to request for downstream use
      (req as any).userRole = user.role;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  };
};
