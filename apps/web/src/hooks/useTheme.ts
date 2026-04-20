import { useEffect } from "react";
import { useThemeStore } from "@/stores/themeStore";

export function useTheme() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    const apply = (next: "light" | "dark") => {
      root.classList.remove("light", "dark");
      root.classList.add(next);
    };

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      apply(media.matches ? "dark" : "light");
      const listener = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    apply(theme);
    return undefined;
  }, [theme]);

  return { theme, setTheme };
}
