import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useMatchRoute,
} from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import { useToastContext } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import type { RouterContext } from "./__root";
import {
  Egg,
  Menu,
  X,
  LogOut,
  BarChart3,
  Plus,
  Package,
  Users,
  UserCheck,
  TrendingUp,
  Calendar,
  Receipt,
  CircleDollarSign,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: ({ context, location }) => {
    const ctx = context as RouterContext;
    // Redirect to login if not authenticated
    if (!ctx.user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: `${location.pathname}${location.search}`,
        },
      });
    }
  },
});

function AuthenticatedLayout() {
  const { user, logout } = useUser();
  const toast = useToastContext();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = user?.role || "staff";

  const handleLogout = () => {
    logout();
    toast.success("You have been logged out successfully.");
    navigate({ to: "/login", search: { redirect: undefined } });
  };

  const ownerNavItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/" },
    {
      id: "daily-entry",
      label: "Daily Entry",
      icon: Plus,
      path: "/daily-entry",
    },
    {
      id: "sales",
      label: "Sales",
      icon: CircleDollarSign,
      path: "/sales",
    },
    { id: "feed", label: "Feed Management", icon: Package, path: "/feed" },
    { id: "houses", label: "House Management", icon: Egg, path: "/houses" },
    { id: "labor", label: "Labor", icon: Users, path: "/labor" },
    { id: "staff", label: "Staff Management", icon: UserCheck, path: "/staff" },
    { id: "expenses", label: "Expenses", icon: Receipt, path: "/expenses" },
    { id: "costs", label: "Cost Analysis", icon: TrendingUp, path: "/costs" },
    { id: "reports", label: "Reports", icon: Calendar, path: "/reports" },
  ];

  const staffNavItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/" },
    { id: "daily-entry", label: "Daily Entry", icon: Plus, path: "/daily-entry" },
    { id: "sales", label: "Sales", icon: CircleDollarSign, path: "/sales" },
    { id: "feed", label: "Feed Management", icon: Package, path: "/feed" },
    { id: "houses", label: "House Management", icon: Egg, path: "/houses" },
    { id: "labor", label: "Labor", icon: Users, path: "/labor" },
    { id: "expenses", label: "Expenses", icon: Receipt, path: "/expenses" },
    { id: "costs", label: "Cost Analysis", icon: TrendingUp, path: "/costs" },
  ];

  const navItems = userRole === "owner" ? ownerNavItems : staffNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Egg className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-balance">Farm Pilot</h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              v2.0
            </Badge>
            <Badge
              variant={userRole === "owner" ? "default" : "outline"}
              className="hidden sm:inline-flex capitalize"
            >
              {userRole}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.username}
            </span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transform border-r bg-background transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:top-0 lg:h-[calc(100vh-4rem)]",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = matchRoute({ to: item.path, fuzzy: false });
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate({ to: item.path });
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 lg:ml-0">
          <div className="h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <div className="max-w-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
