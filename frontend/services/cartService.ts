import api from './api';
import type { ApiResponse, Cart } from '../types';

export const cartService = {
  get: () => api.get<ApiResponse<Cart>>('/cart'),

  addItem: (productId: string, quantity: number) =>
    api.post<ApiResponse<Cart>>('/cart/items', { productId, quantity }),

  updateItem: (productId: string, quantity: number) =>
    api.patch<ApiResponse<Cart>>(`/cart/items/${productId}`, { quantity }),

  removeItem: (productId: string) =>
    api.delete<ApiResponse<Cart>>(`/cart/items/${productId}`),

  clear: () => api.delete<ApiResponse<null>>('/cart'),
};
