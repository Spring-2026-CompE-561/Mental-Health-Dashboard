import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("renders the default title and links the logo to /", async () => {
    render(withProviders(<AppHeader />));
    await waitFor(() => expect(screen.getByText("Mental Health Dashboard")).toBeInTheDocument());
    // Logo + title link points home for unauthenticated visitors.
    const titleLink = screen.getByText("Mental Health Dashboard").closest("a");
    expect(titleLink).toHaveAttribute("href", "/");
    // No nav links when there are none passed and the user is not signed in.
    expect(screen.queryByText("Journals")).not.toBeInTheDocument();
    expect(screen.queryByText("Questionnaire")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  it("renders the authenticated nav links and points the logo to /dashboard when signed in", async () => {
    localStorage.setItem("access_token", "tok");
    apiMocks.getMe.mockResolvedValue({
      id: 1,
      username: "varma",
      email: "v@x.com",
      oauth_provider: null,
      created_at: "2026-01-01",
    });
    render(withProviders(<AppHeader />));
    await waitFor(() => expect(screen.getByText("Journals")).toBeInTheDocument());
    expect(screen.getByText("Questionnaire")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    const titleLink = screen.getByText("Mental Health Dashboard").closest("a");
    expect(titleLink).toHaveAttribute("href", "/dashboard");
  });

  it("respects a custom title prop", async () => {
    render(withProviders(<AppHeader title="Custom" />));
    await waitFor(() => expect(screen.getByText("Custom")).toBeInTheDocument());
  });

  it("renders caller-provided links when not authenticated", async () => {
    render(withProviders(<AppHeader links={[{ label: "Help", href: "/help" }]} />));
    await waitFor(() => expect(screen.getByText("Help")).toBeInTheDocument());
    expect(screen.getByText("Help").closest("a")).toHaveAttribute("href", "/help");
  });
});
