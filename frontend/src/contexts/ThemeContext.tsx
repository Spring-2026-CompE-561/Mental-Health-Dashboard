"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  /** The theme currently applied to the page. */
  theme: Theme;
  /** Convenience flag — true when `theme === "dark"`. */
  isDark: boolean;
  /** Flip between light and dark. No-op when the theme is following the OS. */
  toggleTheme: () => void;
  /** True when the theme is being driven by the OS, not a saved user choice. */
  followsSystem: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "theme";

function readStoredPref(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : null;
}

function readSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

interface ThemeProviderProps {
  children: ReactNode;
  /**
   * When true, the user's saved preference (if any) drives the theme and
   * `toggleTheme` writes to localStorage. When false, the OS preference is
   * always used and the toggle is a no-op — this is the pre-auth experience.
   */
  isAuthenticated?: boolean;
}

export function ThemeProvider({ children, isAuthenticated = false }: ThemeProviderProps) {
  const [systemDark, setSystemDark] = useState<boolean>(() => readSystemDark());
  const [userPref, setUserPref] = useState<Theme | null>(() => readStoredPref());

  // Listen for OS-level theme changes so pre-auth pages stay in sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Effective theme: user preference wins only when authenticated; otherwise follow the OS.
  const followsSystem = !isAuthenticated || !userPref;
  const theme: Theme = followsSystem ? (systemDark ? "dark" : "light") : userPref!;

  // Apply the class to <html> whenever the effective theme changes.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    if (!isAuthenticated) return; // pre-auth users follow the OS — no manual override
    setUserPref((prev) => {
      const current: Theme = prev ?? (readSystemDark() ? "dark" : "light");
      const next: Theme = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage may be unavailable (e.g. private mode). Theme still works in-memory.
      }
      return next;
    });
  }, [isAuthenticated]);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, isDark: theme === "dark", toggleTheme, followsSystem }),
    [theme, toggleTheme, followsSystem],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
