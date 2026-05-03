"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getMe, logout as logoutApi } from "@/services/api";
import type { User } from "@/types";

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (newToken: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // whenever the token changes, refresh the current user
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("access_token");
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signIn = useCallback((newToken: string) => {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // backend logout is best-effort
    }
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = { token, user, loading, signIn, signOut, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/**
 * Wrap any page that should only be accessible when logged in.
 * While the auth state is loading we show a neutral placeholder;
 * once it resolves, unauthenticated visitors are bounced to /login.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }} />;
  }
  if (!isAuthenticated) {
    return <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }} />;
  }
  return children;
}

/**
 * For pages that should only be visible to logged-out users (landing, login, register).
 * If the user is already authenticated, bounce them to the dashboard.
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }} />;
  }
  if (isAuthenticated) {
    return <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }} />;
  }
  return children;
}
