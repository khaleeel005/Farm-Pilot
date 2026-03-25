import React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { UserProvider, useUser } from "./context/UserContext";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import type { RouterContext } from "./routes/__root";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function createAppRouter(user: RouterContext["user"]) {
  return createRouter({
    routeTree,
    context: {
      queryClient,
      user,
    } as RouterContext,
    defaultPreload: "intent",
  });
}

type AppRouter = ReturnType<typeof createAppRouter>;

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}

function InnerApp() {
  const { user, loading } = useUser();
  const routerRef = React.useRef<AppRouter | null>(null);

  useEffect(() => {
    void routerRef.current?.invalidate();
  }, [user]);

  // Wait for user session to be restored before rendering routes
  // This prevents the auth guard from redirecting to login during initial load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!routerRef.current) {
    routerRef.current = createAppRouter(user);
  }

  return (
    <RouterProvider
      router={routerRef.current}
      context={{ queryClient, user }}
    />
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ToastProvider>
          <InnerApp />
          <ReactQueryDevtools initialIsOpen={false} />
        </ToastProvider>
      </UserProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
