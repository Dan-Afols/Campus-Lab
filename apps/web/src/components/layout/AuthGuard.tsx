import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function AuthGuard() {
  const location = useLocation();
  const { hydrated, accessToken } = useAuthStore();

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center">Loading session...</div>;
  }

  if (!accessToken) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}
