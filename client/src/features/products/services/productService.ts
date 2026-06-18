import type { ApiResponse, PaginatedResponse, Product, ProductFilters, ProductFormData } from '../../../types';
import api from '../../../lib/api';

// MongoDB returns _id — normalize it to id so cart identity works correctly
function normalizeProduct(raw: any): Product {
  const imageUrl = raw.imageUrl ?? raw.images?.[0];
  return {
    ...raw,
    id: raw._id ?? raw.id,
    location: typeof raw.location === 'string' ? raw.location : raw.locationLabel ?? '',
    imageUrl,
    images: raw.images?.length ? raw.images : imageUrl ? [imageUrl] : [],
  };
}

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
    
    const response = await api.get<PaginatedResponse<Product>>(`/products?${params}`);
    return {
      ...response.data,
      data: response.data.data.map(normalizeProduct),
    };
  },

  async getById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return normalizeProduct(response.data);
  },

  async getByFarmer(farmerId: string): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>(`/products/farmer/${farmerId}`);
    return response.data.data.map(normalizeProduct);
  },

  async create(data: ProductFormData | FormData): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return normalizeProduct(response.data.data);
  },

  async update(id: string, data: Partial<ProductFormData> | FormData): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return normalizeProduct(response.data.data);
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
