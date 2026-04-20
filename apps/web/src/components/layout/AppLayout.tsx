import { Outlet, useLocation } from "react-router-dom";
import { FAB } from "@/components/ui/FAB";
import { BottomNav } from "@/components/ui/BottomNav";
import { TopHeader } from "@/components/layout/TopHeader";

export function AppLayout() {
  const location = useLocation();
  const showFab = !location.pathname.startsWith("/ai");

  return (
    <div className="phone-frame relative pb-24">
      <TopHeader />
      <main className="px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <BottomNav />
      {showFab ? <FAB /> : null}
    </div>
  );
}
