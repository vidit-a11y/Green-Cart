import type { Request } from 'express';

// ─── User Types ───────────────────────────────────────────────────────────────
export type UserRole = 'farmer' | 'consumer' | 'admin';

export interface IUserPayload {
  id: string;
  role: UserRole;
}

// ─── Extended Request ─────────────────────────────────────────────────────────
export interface AuthRequest extends Request {
  userId: string;
  userRole: UserRole;
}

// ─── API Response Shape ───────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Order Types ──────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface CreateOrderInput {
  consumerId: string;
  items: { productId: string; quantity: number }[];
  deliveryAddress: string;
  paymentMethod: string;
}

// ─── Product Types ────────────────────────────────────────────────────────────
export interface ProductQueryFilters {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: string;
  limit?: string;
}
