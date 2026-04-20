import { Home, GraduationCap, BedDouble, Wallet, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/academics", icon: GraduationCap, label: "Academics" },
  { to: "/hostel", icon: BedDouble, label: "Hostel" },
  { to: "/finance", icon: Wallet, label: "Finance" },
  { to: "/profile", icon: User, label: "Profile" }
];

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed bottom-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 border-t border-mid-gray/20 bg-white/95 px-2 py-2 backdrop-blur dark:border-dark-border dark:bg-dark-surface/95">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              "focus-ring flex min-h-[44px] flex-1 flex-col items-center justify-center rounded-lg text-micro",
              isActive ? "text-electric-blue" : "text-dark-gray dark:text-mid-gray"
            ].join(" ")
          }
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
