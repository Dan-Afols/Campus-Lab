import { create } from "zustand";
import type { User } from "@/types/api.types";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  hydrated: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setHydrated: (value: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
  clear: () => set({ accessToken: null, user: null })
}));
