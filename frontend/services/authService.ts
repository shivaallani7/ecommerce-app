import api from './api';
import type { ApiResponse, User, AuthTokens } from '../types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),

  updateProfile: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>) =>
    api.patch<ApiResponse<User>>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<null>>('/auth/change-password', { currentPassword, newPassword }),
};
