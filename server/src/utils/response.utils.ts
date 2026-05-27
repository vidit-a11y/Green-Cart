import type { Response } from 'express';

/**
 * Standardised success response shape.
 * Every successful API response follows: { success: true, data: T }
 * This ensures the frontend always knows what to expect.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void => {
  res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
};

/**
 * Standardised error response shape.
 * Every error response follows: { success: false, message: string }
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500
): void => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Strips sensitive fields from a user document before sending to client.
 * NEVER send password hashes or internal IDs to the frontend.
 */
export const safeUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  avatar: user.avatar,
  createdAt: user.createdAt,
});
