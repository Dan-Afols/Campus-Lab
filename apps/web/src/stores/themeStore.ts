import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

type ThemeState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const initialTheme = (localStorage.getItem("theme") as ThemeMode | null) ?? "light";

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme });
  }
}));
