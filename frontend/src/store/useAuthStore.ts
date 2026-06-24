import { create } from "zustand";

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  authLoading: boolean;
  isInitializing: boolean;
  setUser: (user: any) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  setIsInitializing: (initializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,
  isInitializing: true,
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setIsInitializing: (isInitializing) => set({ isInitializing }),
}));
