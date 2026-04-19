import type { ApiResponse, PaginatedResponse, User, UserRole } from '../../../types';
import api from '../../../lib/api';

export const userService = {
  async getAll(page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>(
      `/users?page=${page}&limit=${limit}`
    );
    return response.data.data;
  },

  async getById(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async updateRole(id: string, role: UserRole): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/users/${id}`);
  },

  async getStats(): Promise<{
    totalUsers: number;
    farmers: number;
    consumers: number;
    admins: number;
    newUsersThisMonth: number;
  }> {
    const response = await api.get<ApiResponse<{
      totalUsers: number;
      farmers: number;
      consumers: number;
      admins: number;
      newUsersThisMonth: number;
    }>>('/users/stats');
    return response.data.data;
  },
};
