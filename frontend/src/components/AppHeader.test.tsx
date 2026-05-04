import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  getMe: apiMocks.getMe,
  logout: apiMocks.logout,
}));

import AppHeader from "./AppHeader";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

function withProviders(ui: ReactNode) {
  return (
    <AuthProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </AuthProvider>
  );
}

describe("AppHeader", () => {
  beforeEach(() => {
    apiMocks.getMe.mockReset();
    apiMocks.logout.mockReset();
    router.push.mockReset();
    localStorage.clear();
  });

  it("renders the default title and the theme toggle for unauthenticated users", async () => {
    render(withProviders(<AppHeader />));
    await waitFor(() => expect(screen.getByText("Mental Health Dashboard")).toBeInTheDocument());
    expect(screen.getByLabelText(/switch to (dark|light) mode/i)).toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("renders nav links + Logout when authenticated", async () => {
    localStorage.setItem("access_token", "tok");
    apiMocks.getMe.mockResolvedValue({
      id: 1,
      username: "varma",
      email: "v@x.com",
      oauth_provider: null,
      created_at: "2026-01-01",
    });
    render(withProviders(<AppHeader />));
    await waitFor(() => expect(screen.getByText("Logout")).toBeInTheDocument());
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Journals")).toBeInTheDocument();
    expect(screen.getByText("Questionnaire")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("clicking Logout signs out and navigates to /login", async () => {
    localStorage.setItem("access_token", "tok");
    apiMocks.getMe.mockResolvedValue({
      id: 1,
      username: "u",
      email: "e@x.com",
      oauth_provider: null,
      created_at: "2026-01-01",
    });
    apiMocks.logout.mockResolvedValueOnce({ success: true, message: "" });
    render(withProviders(<AppHeader />));
    await waitFor(() => expect(screen.getByText("Logout")).toBeInTheDocument());
    await act(async () => {
      screen.getByText("Logout").click();
    });
    expect(apiMocks.logout).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/login");
  });

  it("renders custom title prop", async () => {
    render(withProviders(<AppHeader title="Custom" />));
    await waitFor(() => expect(screen.getByText("Custom")).toBeInTheDocument());
  });
});
