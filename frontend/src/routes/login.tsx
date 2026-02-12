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
import { Egg, Lock } from "lucide-react";

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
          // Invalidate router and navigate to dashboard
          await router.invalidate();
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
