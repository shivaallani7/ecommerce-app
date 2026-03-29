import api from './api';
import type { ApiResponse, PaginatedResponse, Product, ProductFilters } from '../types';

export const productService = {
  getAll: (filters: ProductFilters = {}) =>
    api.get<PaginatedResponse<Product>>('/products', { params: filters }),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<Product>>(`/products/slug/${slug}`),

  getById: (id: string) =>
    api.get<ApiResponse<Product>>(`/products/${id}`),

  getFeatured: () =>
    api.get<ApiResponse<Product[]>>('/products/featured'),

  create: (data: FormData | object) =>
    api.post<ApiResponse<Product>>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.patch<ApiResponse<Product>>(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/products/${id}`),
};
