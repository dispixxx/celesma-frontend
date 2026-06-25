import { create } from 'zustand';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import type { LoginRequest, RegisterRequest } from '../types';

interface AuthState {
  token: string | null;
  username: string | null;
  avatarUrl: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loadUserData: () => Promise<void>;
  setAvatarUrl: (url: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  avatarUrl: localStorage.getItem('avatarUrl'),
  isAuthenticated: !!localStorage.getItem('token'),
  

  login: async (data) => {
    const response = await authApi.login(data);
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    set({ token: response.token, username: response.username, isAuthenticated: true });
    // Загружаем полные данные пользователя после логина
    try {
      const user = await usersApi.getByUsername(response.username);
      localStorage.setItem('avatarUrl', user.avatarUrl || '');
      set({ avatarUrl: user.avatarUrl });
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  },

  register: async (data) => {
    const response = await authApi.register(data);
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    set({ token: response.token, username: response.username, isAuthenticated: true });
    // Загружаем полные данные пользователя после регистрации
    try {
      const user = await usersApi.getByUsername(response.username);
      localStorage.setItem('avatarUrl', user.avatarUrl || '');
      set({ avatarUrl: user.avatarUrl });
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('avatarUrl');
    set({ token: null, username: null, avatarUrl: null, isAuthenticated: false });
  },

  loadUserData: async () => {
    const username = localStorage.getItem('username');
    if (!username) return;
    try {
      const user = await usersApi.getByUsername(username);
      localStorage.setItem('avatarUrl', user.avatarUrl || '');
      set({ avatarUrl: user.avatarUrl });
    } catch (e) {
      console.error('Failed to load user data', e);
    }
  },

  setAvatarUrl: (url) => {
    localStorage.setItem('avatarUrl', url || '');
    set({ avatarUrl: url });
  },
}));