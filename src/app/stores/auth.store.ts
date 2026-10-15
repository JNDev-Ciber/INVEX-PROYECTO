import { create } from "zustand";

export interface AuthUser {
  id: string | number;
  username: string;
  rol: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isSessionChecked: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (user: AuthUser) => void;
  logout: () => void;
  setSessionChecked: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,
  isSessionChecked: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
  setSessionChecked: () => set({ isSessionChecked: true }),
}));

export function useAuthHydration() {
  return useAuthStore((state) => state.isSessionChecked);
}
