import type { ApiResponse, PaginatedResponse, Product, ProductFilters, ProductFormData } from '../types';
import api from './api';

export const productService = {
  async getAll(filters?: ProductFilters, page = 1, limit = 12): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await api.get<ApiResponse<PaginatedResponse<Product>>>(`/products?${params}`);
    return response.data.data;
  },

  async getById(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  async getByFarmer(farmerId: string): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>(`/products/farmer/${farmerId}`);
    return response.data.data;
  },

  async create(data: ProductFormData): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/products/${id}`);
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/categories');
    return response.data.data;
  },

  async getLocations(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/locations');
    return response.data.data;
  },

  async search(query: string): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  },
};
