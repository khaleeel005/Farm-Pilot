import type React from 'react';
import { useState } from 'react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { cn } from './lib/utils';
import { login as apiLogin } from './lib/api';
import { useUser } from './context/UserContext';
import {
  BarChart3,
  Egg,
  Users,
  TrendingUp,
  Calendar,
  Package,
  Plus,
  Bell,
  Search,
  UserCheck,
  BarChart2,
  Menu,
  X,
  Receipt,
  Lock,
  LogOut,
} from 'lucide-react';
import { DashboardOverview } from './components/dashboard-overview';
import { DailyEntryForm } from './components/daily-entry-form';
import { SalesManagement } from './components/sales-management';
import { FeedManagement } from './components/feed-management';
import { LaborManagement } from './components/labor-management';
import { CostAnalysis } from './components/cost-analysis';
import { ReportsSection } from './components/reports-section';
import { StaffDashboard } from './components/staff-dashboard';
import { StaffManagement } from './components/staff-management';
import { ExpenseManagement } from './components/expense-management';
import { StaffDailyEntry } from './components/staff-daily-entry';
import { HouseManagement } from './components/house-management';
import { UserProvider } from './context/UserContext';
import { ToastProvider, useToastContext } from './context/ToastContext';
import { ThemeToggle } from './components/shared/theme-toggle';

export default function FarmPilot() {
  return (
    <UserProvider>
      <ToastProvider>
        <FarmPilotApp />
      </ToastProvider>
    </UserProvider>
  );
}

function FarmPilotApp() {
  const { user, loading, logout } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toast = useToastContext();

  // Determine user role from the context
  const userRole = user?.role || 'staff';

  function LoginShell() {
    const { refresh } = useUser();
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);
    const loginToast = useToastContext();

    const handleLoginInner = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginLoading(true);
      try {
        const res = await apiLogin({ username: loginForm.username, password: loginForm.password });
        if (res && res.token) {
          const ok = await refresh();
          if (ok) {
            loginToast.success('Login successful! Welcome back.');
          } else {
            loginToast.error('Login succeeded but user fetch failed. Please try again.');
          }
        } else {
          loginToast.error('Invalid credentials. Please check your username and password.');
        }
      } catch (err) {
        console.error('Login failed', err);
        let msg = 'Login failed. Please try again.';
        if (err && typeof err === 'object' && 'message' in err) {
          const errObj = err as { message?: unknown };
          if (typeof errObj.message === 'string') {
            msg = errObj.message;
          }
        }
        loginToast.error(msg);
      } finally {
        setLoginLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Egg className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-balance">
                Welcome to Farm Pilot
              </CardTitle>
              <CardDescription className="text-balance">
                Sign in to manage your egg production operations
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginInner} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Please sign in with your account credentials.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
    toast.success('You have been logged out successfully.');
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginShell />;
  }

  const ownerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'daily-entry', label: 'Daily Entry', icon: Plus },
    {
      id: 'sales',
      label: 'Sales',
      icon: () => <span className="text-sm font-bold">₦</span>,
    },
    { id: 'feed', label: 'Feed Management', icon: Package },
    { id: 'houses', label: 'House Management', icon: Egg },
    { id: 'labor', label: 'Labor', icon: Users },
    { id: 'staff', label: 'Staff Management', icon: UserCheck },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'costs', label: 'Cost Analysis', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: Calendar },
  ];

  const renderOwnerContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'daily-entry':
        return <DailyEntryForm />;
      case 'sales':
        return <SalesManagement />;
      case 'feed':
        return <FeedManagement />;
      case 'houses':
        return <HouseManagement />;
      case 'labor':
        return <LaborManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'costs':
        return <CostAnalysis />;
      case 'reports':
        return <ReportsSection />;
      default:
        return <DashboardOverview />;
    }
  };

  const renderStaffTabs = () => (
    <>
      <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </TabsTrigger>
        <TabsTrigger value="daily-entry" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Daily Log</span>
        </TabsTrigger>
        <TabsTrigger value="expenses" className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">Expenses</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-6">
        <StaffDashboard onNavigate={setActiveTab} />
      </TabsContent>
      <TabsContent value="daily-entry" className="space-y-6">
        <StaffDailyEntry />
      </TabsContent>
      <TabsContent value="expenses" className="space-y-6">
        <ExpenseManagement userRole="staff" />
      </TabsContent>
    </>
  );

  if (userRole === 'staff') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Egg className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-balance">Farm Pilot</h1>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                v2.0
              </Badge>
              <Badge variant="outline" className="hidden sm:inline-flex">
                Staff
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.username}
              </span>
              <Button variant="ghost" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {renderStaffTabs()}
          </Tabs>
        </div>
      </div>
    );
  }

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
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
            <Badge variant="default" className="hidden sm:inline-flex">
              Owner
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.username}</span>
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transform border-r bg-background transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:top-0 lg:h-[calc(100vh-4rem)]',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
              {ownerNavItems.map((item) => {
                const Icon = item.icon as React.ElementType;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="h-[calc(100vh-4rem)] overflow-auto p-6">{renderOwnerContent()}</div>
        </main>
      </div>
    </div>
  );
}
