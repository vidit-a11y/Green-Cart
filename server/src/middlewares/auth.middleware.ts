import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.utils.js';

/**
 * Authentication Middleware
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches the decoded userId to the request object.
 *
 * MOVED FROM: authRoutes.ts (was incorrectly placed in the routes layer)
 * BELONGS HERE: middlewares/ — middleware is reusable cross-cutting logic
 *
 * Usage: router.get('/me', authenticateToken, getController)
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    (req as any).userId = decoded.id;
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};
