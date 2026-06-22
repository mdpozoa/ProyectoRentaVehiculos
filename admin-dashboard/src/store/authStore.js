import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  admin: null,
  token: null,
  login: (admin, token) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(admin));
    set({ admin, token });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ admin: null, token: null });
  },
  initSession: () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    if (token && userStr) {
      set({ token, admin: JSON.parse(userStr) });
    }
  }
}));
