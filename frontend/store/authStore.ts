import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;

  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage),
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    },
  ),
);
