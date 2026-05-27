import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { generateToken } from '../utils/jwt.utils.js';
import { sendError, sendSuccess } from '../utils/response.utils.js';

/**
 * Auth Controller — HTTP Layer Only
 *
 * Controllers are THIN. They:
 * 1. Extract data from req (body, params, query)
 * 2. Call the service layer
 * 3. Send the HTTP response
 *
 * Controllers do NOT contain business logic.
 * Business logic lives in services/authService.ts
 */

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    const result = await authService.registerUser({ name, email, password, role, phone, address });
    sendSuccess(res, result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error registering user';
    const status = message === 'Email already registered' ? 400 : 500;
    sendError(res, message, status);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error logging in';
    const status = message === 'Invalid credentials' ? 401 : 500;
    sendError(res, message, status);
  }
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const token = generateToken(user._id.toString());
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`;
    res.redirect(redirectUrl);
  } catch {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await authService.getUserById(userId);
    sendSuccess(res, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error fetching user';
    sendError(res, message, message === 'User not found' ? 404 : 500);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await authService.updateUserProfile(userId, req.body);
    sendSuccess(res, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error updating profile';
    sendError(res, message, 500);
  }
};
