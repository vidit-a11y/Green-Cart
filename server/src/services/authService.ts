import bcrypt from 'bcryptjs';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.utils.js';
import { safeUser } from '../utils/response.utils.js';
import { normalizeCoordinates, toGeoPoint } from './deliveryService.js';

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
  location?: { coordinates: [number, number] };
}) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const coordinates = normalizeCoordinates(data.location);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashedPassword,
    role: data.role || 'consumer',
    phone: data.phone,
    address: data.address,
    ...(coordinates ? { location: toGeoPoint(coordinates) } : {}),
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

  // ── Normalize location input ──────────────────────────────────────────────
  // Accept both:
  //   a) Flat:   { lat: 18.52, lng: 73.85 }
  //   b) GeoJSON: { location: { type: 'Point', coordinates: [lng, lat] } }
  if (
    updates.lat !== undefined &&
    updates.lng !== undefined &&
    updates.location === undefined
  ) {
    const lat = Number(updates.lat);
    const lng = Number(updates.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      updates.location = { type: 'Point', coordinates: [lng, lat] };
    }
    delete updates.lat;
    delete updates.lng;
  }

  const coordinates = normalizeCoordinates(updates.location);
  if (updates.location !== undefined) {
    if (!coordinates) {
      throw new Error('Valid location coordinates are required');
    }
    updates.location = toGeoPoint(coordinates);
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
  if (!user) throw new Error('User not found');

  if (coordinates && user.role === 'farmer') {
    await Product.updateMany(
      { farmerId: userId },
      { $set: { geoLocation: toGeoPoint(coordinates) } }
    );
  }

  return user;
};
