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
  Leaf,
  ShieldCheck,
  Tractor,
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
          redirect: location.pathname,
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
    {
      id: "daily-entry",
      label: "Daily Entry",
      icon: Plus,
      path: "/daily-entry",
    },
    { id: "sales", label: "Sales", icon: CircleDollarSign, path: "/sales" },
    { id: "feed", label: "Feed Management", icon: Package, path: "/feed" },
    { id: "houses", label: "House Management", icon: Egg, path: "/houses" },
    { id: "labor", label: "Labor", icon: Users, path: "/labor" },
    { id: "expenses", label: "Expenses", icon: Receipt, path: "/expenses" },
    { id: "costs", label: "Cost Analysis", icon: TrendingUp, path: "/costs" },
  ];

  const navItems = userRole === "owner" ? ownerNavItems : staffNavItems;
  const roleLabel = userRole === "owner" ? "Owner Console" : "Staff Console";
  const RoleIcon = userRole === "owner" ? ShieldCheck : Tractor;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17.5rem_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border/70 bg-sidebar/95 text-sidebar-foreground backdrop-blur transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:w-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col p-5">
          <div className="rounded-2xl border border-sidebar-border bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
                <Egg className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="display-heading text-xl leading-tight">Farm Pilot</p>
                <p className="text-xs uppercase tracking-[0.22em] text-sidebar-foreground/70">
                  Operations Hub
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 p-2">
              <RoleIcon className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium">{roleLabel}</span>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item, index) => {
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
                    "fade-rise flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/20"
                      : "text-sidebar-foreground/85 hover:bg-white/10 hover:text-sidebar-foreground",
                  )}
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-xl border border-sidebar-border bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/70">
              Signed In As
            </p>
            <p className="mt-1 text-sm font-medium text-sidebar-foreground">
              {user?.username}
            </p>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                <p className="display-heading text-lg leading-none">Field Ledger</p>
              </div>
              <Badge
                variant={userRole === "owner" ? "default" : "secondary"}
                className="hidden sm:inline-flex"
              >
                {userRole}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6 lg:p-7">
          <div className="fade-rise rounded-3xl border border-border/60 bg-card/70 p-4 shadow-[0_20px_45px_-28px_oklch(0.2_0.02_50/0.35)] backdrop-blur md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
