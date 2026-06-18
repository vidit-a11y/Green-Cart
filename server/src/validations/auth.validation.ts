/**
 * Auth Validation Schemas
 *
 * Centralised validation rules for auth endpoints.
 * These are used by validate.middleware.ts.
 * Keeping rules here (not in middleware) makes them testable and reusable.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateRegisterInput = (body: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  const { name, email, password, role, location } = body;

  if (!name || typeof name !== 'string' || (name as string).trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (!password || typeof password !== 'string' || (password as string).length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  const validRoles = ['farmer', 'consumer', 'admin'];
  if (role && !validRoles.includes(role as string)) {
    errors.push('Role must be farmer, consumer, or admin');
  }

  if (role === 'farmer') {
    const coordinates = (location as { coordinates?: unknown } | undefined)?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      errors.push('Farmer location must include [longitude, latitude]');
    } else if (coordinates.some((value) => !Number.isFinite(Number(value)))) {
      errors.push('Farmer location coordinates must be valid numbers');
    }
  }

  return { valid: errors.length === 0, errors };
};

export const validateLoginInput = (body: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  const { email, password } = body;

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  return { valid: errors.length === 0, errors };
};
