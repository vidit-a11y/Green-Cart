import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.utils.js';
import { safeUser } from '../utils/response.utils.js';

/**
 * Auth Service — Business Logic Layer
 *
 * Controllers call these functions. Services contain the ACTUAL logic.
 * This separation means:
 * - Controllers stay thin (just HTTP in/out)
 * - Business logic is testable without HTTP
 * - Logic can be reused across multiple controllers/routes
 *
 * Real-world analogy: The controller is the waiter (takes your order),
 * the service is the kitchen (does the actual cooking).
 */

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  address?: string;
}) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    role: data.role || 'consumer',
    phone: data.phone,
    address: data.address,
  });

  const token = generateToken(user._id.toString());
  return { user: safeUser(user), token };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.password) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user._id.toString());
  return { user: safeUser(user), token };
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};

export const updateUserProfile = async (userId: string, updates: Record<string, any>) => {
  // Security: never allow password or googleId to be updated via profile endpoint
  delete updates.password;
  delete updates.googleId;
  delete updates.role; // role changes should go through admin endpoint only

  const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};
