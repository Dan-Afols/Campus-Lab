import { NavLink, Outlet } from "react-router-dom";

type Props = {
  fullName: string;
  onLogout: () => void;
  installPrompt: (() => Promise<void>) | null;
};

const navItems = [
  ["/", "Dashboard"],
  ["/academics", "Academics"],
  ["/news", "News"],
  ["/hostel", "Hostel"],
  ["/wellbeing", "Health & Finance"],
  ["/assistant", "AI Assistant"],
  ["/settings", "Settings"]
] as const;

export function Shell({ fullName, onLogout, installPrompt }: Props) {
  return (
    <div className="shell">
      <aside className="side-panel">
        <div className="brand">
          <h1>Campus Lab</h1>
          <p>PWA Edition</p>
        </div>
        <nav className="nav-grid">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="side-actions">
          {installPrompt ? (
            <button className="ghost" onClick={() => void installPrompt()}>
              Install App
            </button>
          ) : null}
          <button className="danger" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="content-panel">
        <header className="topbar">
          <div>
            <h2>Welcome back, {fullName || "Student"}</h2>
            <p>Connected to your local Campus Lab stack.</p>
          </div>
          <div className="pill">PWA + Local API</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
