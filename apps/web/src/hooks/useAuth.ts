import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, refresh } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function useAuthBootstrap() {
  useEffect(() => {
    let active = true;
    const { setHydrated } = useAuthStore.getState();

    const hydrationGuard = window.setTimeout(() => {
      if (active) {
        setHydrated(true);
      }
    }, 8000);

    const bootstrap = async () => {
      const { setAccessToken, setUser, setHydrated, clear } = useAuthStore.getState();
      try {
        const storedAccessToken = localStorage.getItem("campuslab_access_token");
        const storedRefreshToken = localStorage.getItem("campuslab_refresh_token");

        if (storedAccessToken && active) {
          setAccessToken(storedAccessToken);
        }

        let me: any = null;
        try {
          me = await getCurrentUser();
        } catch {
          if (!storedRefreshToken) {
            throw new Error("No refresh token available");
          }

          const refreshed = await refresh(storedRefreshToken);
          localStorage.setItem("campuslab_access_token", refreshed.accessToken);
          localStorage.setItem("campuslab_refresh_token", refreshed.refreshToken);

          if (active) {
            setAccessToken(refreshed.accessToken);
          }

          me = await getCurrentUser();
        }

        if (active && me) {
          setUser(me);
        }
      } catch {
        if (active) {
          localStorage.removeItem("campuslab_access_token");
          localStorage.removeItem("campuslab_refresh_token");
          clear();
        }
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
      window.clearTimeout(hydrationGuard);
    };
  }, []);
}

export function useRequireAuth(redirectTo = "/login") {
  const navigate = useNavigate();
  const { accessToken, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !accessToken) {
      navigate(redirectTo, { replace: true });
    }
  }, [hydrated, accessToken, navigate, redirectTo]);
}
