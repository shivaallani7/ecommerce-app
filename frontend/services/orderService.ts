import api from './api';
import type { ApiResponse, PaginatedResponse, Order, ShippingAddress } from '../types';

export const orderService = {
  create: (data: { shippingAddress: ShippingAddress; billingAddress?: ShippingAddress; notes?: string }) =>
    api.post<ApiResponse<{ order: Order; clientSecret: string }>>('/orders', data),

  confirm: (orderId: string) =>
    api.post<ApiResponse<Order>>(`/orders/${orderId}/confirm`),

  getMyOrders: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<Order>>('/orders/my', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<ApiResponse<Order>>(`/orders/my/${id}`),

  // Admin
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Order>>('/orders', { params }),

  updateStatus: (id: string, status: string, trackingNumber?: string) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status, trackingNumber }),
};
