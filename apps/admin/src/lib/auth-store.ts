import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN" | "SCHOOL_ADMIN" | "COLLEGE_ADMIN";
  schoolId?: string;
  collegeId?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

interface AuthStore {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAdmin: (admin: AdminUser | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      setAdmin: (admin) => set({ admin }),
      setToken: (token) => set({ token }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      logout: () => {
        set({ admin: null, token: null, isAuthenticated: false });
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
      },
    }),
    {
      name: "admin-auth-storage",
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
