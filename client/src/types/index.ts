export type UserRole = 'farmer' | 'consumer' | 'admin';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  location?: GeoPoint;
  savedAddresses?: SavedAddress[];
  createdAt: string;
}

export interface SavedAddress {
  _id?: string;
  label: 'Home' | 'Work' | 'Other';
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: [number, number]; // [lng, lat]
  isDefault: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
  location?: GeoPoint;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Product {
  _id?: string;
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  unit: string;
  images: string[];
  imageUrl?: string;
  farmerId: string;
  farmerName?: string;
  location: string;
  geoLocation?: GeoPoint;
  isAvailable: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  unit: string;
  images: string[];
  imageUrl?: string;
  location: string;
  isAvailable: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Order {
  _id?: string;
  id: string;
  consumerId: string;
  farmerId: string;
  farmerName?: string;
  items: OrderItem[];
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  distanceKm?: number;
  deliveryDistanceKm?: number;
  farmerLocationLabel?: string;
  customerLocation?: GeoPoint;
  farmerLocation?: GeoPoint;
  minimumOrderMet: boolean;
  // Simulated rider fields
  assignedRider?: string;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  riderVehicleNumber?: string;
  riderRating?: number;
  riderPhoto?: string;
  simulationStartTime?: string;
  estimatedMinutes?: number;
  estimatedDeliveryTime?: string;
  deliveryStatus:
    | 'pending'
    | 'farmer_accepted'
    | 'picked_up'
    | 'in_transit'
    | 'delivered';
  status: OrderStatus;
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryQuote {
  farmerId: string;
  farmerName: string;
  farmerLocation: string;
  farmerCoordinates: [number, number];
  distanceKm: number;
  deliveryFee: number;
  subtotalAmount: number;
  totalAmount: number;
  minimumOrderMet: boolean;
  withinServiceArea: boolean;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
  sortBy?: 'price' | 'name' | 'rating' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}
