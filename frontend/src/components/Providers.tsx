"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

/**
 * Bridges the auth state into the theme provider. When the user is signed in
 * the theme follows their saved preference (settable in /settings); when they
 * are signed out the theme follows the OS — across the landing page, login,
 * create-account and password-reset flows.
 */
function ThemeBridge({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return <ThemeProvider isAuthenticated={isAuthenticated}>{children}</ThemeProvider>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeBridge>
        {children}
        <Toaster
          position="bottom-right"
          icons={{
            success: (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#22c55e" />
                <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            error: (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#ef4444" />
                <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ),
          }}
        />
      </ThemeBridge>
    </AuthProvider>
  );
}
