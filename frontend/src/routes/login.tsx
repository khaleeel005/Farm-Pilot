import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type React from "react";
import type { RouterContext } from "./__root";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { login as apiLogin } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { useToastContext } from "@/context/ToastContext";
import { Egg, Lock, Leaf } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
    };
  },
  component: LoginPage,
  beforeLoad: ({ context }) => {
    const ctx = context as RouterContext;
    // Redirect to dashboard if already logged in
    if (ctx.user) {
      throw redirect({ to: "/" });
    }
  },
});

function LoginPage() {
  const { refresh } = useUser();
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const toast = useToastContext();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await apiLogin({
        username: loginForm.username,
        password: loginForm.password,
      });
      if (res && res.token) {
        const ok = await refresh();
        if (ok) {
          toast.success("Login successful! Welcome back.");
          // Invalidate router and respect the original auth redirect target.
          await router.invalidate();
          const redirectTarget = search.redirect;
          if (redirectTarget && redirectTarget.startsWith("/")) {
            window.location.assign(redirectTarget);
            return;
          }
          navigate({ to: "/" });
        } else {
          toast.error(
            "Login succeeded but user fetch failed. Please try again.",
          );
        }
      } else {
        toast.error(
          "Invalid credentials. Please check your username and password.",
        );
      }
    } catch (err) {
      console.error("Login failed", err);
      let msg = "Login failed. Please try again.";
      if (err && typeof err === "object" && "message" in err) {
        const errObj = err as { message?: unknown };
        if (typeof errObj.message === "string") {
          msg = errObj.message;
        }
      }
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[-10rem] top-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-chart-2/15 blur-3xl" />
      </div>

      <Card className="fade-rise relative w-full max-w-md border-border/60 bg-card/85 shadow-[0_28px_80px_-36px_oklch(0.2_0.03_60/0.6)] backdrop-blur">
        <CardHeader className="space-y-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.45rem] bg-primary shadow-lg shadow-primary/25">
            <Egg className="h-9 w-9 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="display-heading text-4xl leading-tight text-balance">
              Farm Pilot
            </CardTitle>
            <CardDescription className="mx-auto max-w-xs text-balance text-base">
              Precision operations for your egg production floor.
            </CardDescription>
          </div>
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            Field-ready control panel
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                className="h-11 border-border/70 bg-background/85"
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
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                className="h-11 border-border/70 bg-background/85"
                required
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-xl"
              disabled={loginLoading}
            >
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
            <p>Use your account credentials to continue.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
