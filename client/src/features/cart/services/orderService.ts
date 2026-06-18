import type {
  ApiResponse,
  DeliveryQuote,
  GeoPoint,
  Order,
  OrderStatus,
  PaginatedResponse,
} from '../../../types';
import api from '../../../lib/api';

interface CreateOrderData {
  items: { productId: string; quantity: number }[];
  deliveryAddress: string;
  paymentMethod: string;
  customerLocation: GeoPoint;
}

interface DeliveryQuoteData {
  items: { productId: string; quantity: number }[];
  customerLocation: GeoPoint;
}

export const orderService = {
  async create(data: CreateOrderData): Promise<Order> {
    try {
      const response = await api.post<ApiResponse<Order>>('/orders', data);
      return response.data.data;
    } catch (error: any) {
      // Surface the server's error message instead of the generic axios one
      const message = error?.response?.data?.message || error?.message || 'Failed to place order';
      throw new Error(message);
    }
  },

  async getDeliveryQuote(data: DeliveryQuoteData): Promise<DeliveryQuote> {
    const response = await api.post<ApiResponse<DeliveryQuote>>('/orders/quote', data);
    return response.data.data;
  },

  async getConsumerOrders(page = 1, limit = 10): Promise<PaginatedResponse<Order>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>(
      `/orders/consumer?page=${page}&limit=${limit}`
    );
    return response.data.data;
  },

  async getFarmerOrders(page = 1, limit = 10): Promise<PaginatedResponse<Order>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>(
      `/orders/farmer?page=${page}&limit=${limit}`
    );
    return response.data.data;
  },

  async getById(id: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return response.data.data;
  },

  async cancel(id: string): Promise<Order> {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data.data;
  },

  async getAllOrders(page = 1, limit = 20): Promise<PaginatedResponse<Order>> {
    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>(
      `/orders?page=${page}&limit=${limit}`
    );
    return response.data.data;
  },
};
