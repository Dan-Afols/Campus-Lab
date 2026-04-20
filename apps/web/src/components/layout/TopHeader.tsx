import { Bell, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/news": "News",
  "/notifications": "Notifications",
  "/academics": "Academics",
  "/hostel": "Hostel",
  "/finance": "Finance",
  "/health": "Health",
  "/ai": "Campus Lab AI",
  "/profile": "Profile",
  "/settings": "Settings"
};

export function TopHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clear);
  const title = Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] ?? "Campus Lab";
  const rawDepartment = (user as any)?.department;
  const departmentLabel =
    typeof rawDepartment === "string" ? rawDepartment : typeof rawDepartment?.name === "string" ? rawDepartment.name : "Student workspace";

  const onLogout = () => {
    localStorage.removeItem("campuslab_access_token");
    localStorage.removeItem("campuslab_refresh_token");
    localStorage.removeItem("campuslab_user_name");
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <header className="safe-top sticky top-0 z-20 border-b border-mid-gray/20 bg-white/95 px-4 pb-3 backdrop-blur dark:border-dark-border dark:bg-dark-surface/95">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">{title}</h1>
          <p className="text-caption text-mid-gray">{departmentLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onLogout} aria-label="Logout" className="!min-h-10">
            <LogOut className="h-4 w-4" />
          </Button>
          <Link to="/notifications" className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-light-gray dark:bg-near-black" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Link>
          <Link to="/profile" aria-label="Profile">
            <Avatar name={user?.fullName ?? "Student"} src={(user as any)?.profilePhotoUrl} size={40} />
          </Link>
        </div>
      </div>
    </header>
  );
}
