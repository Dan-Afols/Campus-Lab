import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  BookOpen,
  Building2,
  Home,
  Newspaper,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        label: "Overview",
        path: "/dashboard",
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "User Management",
    items: [
      {
        label: "All Students",
        path: "/users/students",
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: "Course Representatives",
        path: "/users/course-reps",
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: "Admin Management",
        path: "/users/admins",
        icon: <Users className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Academic Management",
    items: [
      {
        label: "Academic Structure",
        path: "/academic/structure",
        icon: <Building2 className="w-4 h-4" />,
      },
      {
        label: "Timetable Builder",
        path: "/academic/timetable",
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        label: "Course Materials",
        path: "/academic/materials",
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        label: "Past Questions",
        path: "/academic/past-questions",
        icon: <BookOpen className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Hostel Management",
    items: [
      {
        label: "Hostel Setup",
        path: "/hostel/setup",
        icon: <Home className="w-4 h-4" />,
      },
      {
        label: "Bed Map",
        path: "/hostel/bed-map",
        icon: <Home className="w-4 h-4" />,
      },
      {
        label: "Bookings",
        path: "/hostel/bookings",
        icon: <Home className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "News & Communications",
    items: [
      {
        label: "Create Post",
        path: "/news/create",
        icon: <Newspaper className="w-4 h-4" />,
      },
      {
        label: "All Posts",
        path: "/news/all",
        icon: <Newspaper className="w-4 h-4" />,
      },
      {
        label: "Notification Logs",
        path: "/news/notifications",
        icon: <Newspaper className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "System Management",
    items: [
      {
        label: "Settings",
        path: "/system/settings",
        icon: <Settings className="w-4 h-4" />,
      },
      {
        label: "Audit Logs",
        path: "/system/audit-logs",
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSections, setOpenSections] = useState<string[]>(["Dashboard"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((s) => s !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              CampusLab
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navSections.map((section) => (
            <div key={section.title}>
              {sidebarOpen ? (
                <div>
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <span>{section.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openSections.includes(section.title)
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {openSections.includes(section.title) && (
                    <div className="mt-2 space-y-1 ml-2 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                      {section.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive(item.path)
                              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={item.label}
                      className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {item.icon}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Logged in as
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {admin?.fullName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {admin?.email}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-full flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
