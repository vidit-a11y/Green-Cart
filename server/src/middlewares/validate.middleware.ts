import type { NextFunction, Request, Response } from 'express';
import {
  validateLoginInput,
  validateRegisterInput,
} from '../validations/auth.validation.js';
import {
  validateOrderInput,
  validateProductInput,
} from '../validations/product.validation.js';

/**
 * Validation Middleware
 *
 * Thin wrappers that call validation schemas and return 400 on failure.
 * Validation LOGIC lives in validations/ — not here.
 * This file only handles the HTTP concern (reading req.body, sending 400).
 */

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const result = validateRegisterInput(req.body as Record<string, unknown>);
  if (!result.valid) {
    res.status(400).json({ success: false, message: result.errors.join(', ') });
    return;
  }
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const result = validateLoginInput(req.body as Record<string, unknown>);
  if (!result.valid) {
    res.status(400).json({ success: false, message: result.errors.join(', ') });
    return;
  }
  next();
};

export const validateProduct = (req: Request, res: Response, next: NextFunction): void => {
  const result = validateProductInput(req.body as Record<string, unknown>);
  if (!result.valid) {
    res.status(400).json({ success: false, message: result.errors.join(', ') });
    return;
  }
  next();
};

export const validateOrder = (req: Request, res: Response, next: NextFunction): void => {
  const result = validateOrderInput(req.body as Record<string, unknown>);
  if (!result.valid) {
    res.status(400).json({ success: false, message: result.errors.join(', ') });
    return;
  }
  next();
};
