import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  getMe: apiMocks.getMe,
  logout: apiMocks.logout,
}));

import { AuthProvider, useAuth, ProtectedRoute, PublicOnlyRoute } from "./AuthContext";

function AuthProbe() {
  const { token, user, isAuthenticated, signIn, signOut, loading } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? "null"}</span>
      <span data-testid="user">{user ? user.username : "null"}</span>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button onClick={() => signIn("tok-123")}>sign-in</button>
      <button onClick={() => signOut()}>sign-out</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    apiMocks.getMe.mockReset();
    apiMocks.logout.mockReset();
    router.push.mockReset();
    router.replace.mockReset();
    localStorage.clear();
  });

  it("starts unauthenticated when no stored token exists", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("auth").textContent).toBe("false");
    expect(screen.getByTestId("token").textContent).toBe("null");
  });

  it("loads the stored token and fetches the current user", async () => {
    localStorage.setItem("access_token", "tok-1");
    apiMocks.getMe.mockResolvedValueOnce({
      id: 1,
      username: "varma",
      email: "v@x.com",
      oauth_provider: null,
      created_at: "2026-01-01",
    });
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(apiMocks.getMe).toHaveBeenCalled();
    expect(screen.getByTestId("user").textContent).toBe("varma");
    expect(screen.getByTestId("auth").textContent).toBe("true");
  });

  it("signIn() persists the token and triggers user fetch", async () => {
    apiMocks.getMe.mockResolvedValue({
      id: 1,
      username: "u",
      email: "e@x.com",
      oauth_provider: null,
      created_at: "2026-01-01",
    });
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    act(() => screen.getByText("sign-in").click());
    expect(localStorage.getItem("access_token")).toBe("tok-123");
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("true"));
  });

  it("signOut() calls the logout API and clears the token", async () => {
    localStorage.setItem("access_token", "tok-1");
    apiMocks.getMe.mockResolvedValueOnce({
      id: 1,
      username: "u",
      email: "e@x.com",
      oauth_provider: null,
      created_at: "2026-01-01",
    });
    apiMocks.logout.mockResolvedValueOnce({ success: true, message: "" });
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("true"));
    await act(async () => {
      screen.getByText("sign-out").click();
    });
    expect(apiMocks.logout).toHaveBeenCalled();
    expect(localStorage.getItem("access_token")).toBeNull();
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("false"));
  });

  it("clears the token if /users/me rejects (token invalid)", async () => {
    localStorage.setItem("access_token", "bad");
    apiMocks.getMe.mockRejectedValueOnce(new Error("401"));
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("auth").textContent).toBe("false"));
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("ProtectedRoute redirects to /login when unauthenticated", async () => {
    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>secret</div>
        </ProtectedRoute>
      </AuthProvider>
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("ProtectedRoute renders children when authenticated", async () => {
    localStorage.setItem("access_token", "tok-1");
    apiMocks.getMe.mockResolvedValueOnce({
      id: 1,
      username: "u",
      email: "e@x.com",
      oauth_provider: null,
      created_at: "2026-01-01",
    });
    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>secret</div>
        </ProtectedRoute>
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText("secret")).toBeInTheDocument());
  });

  it("PublicOnlyRoute redirects authenticated users to /dashboard", async () => {
    localStorage.setItem("access_token", "tok-1");
    apiMocks.getMe.mockResolvedValueOnce({
      id: 1,
      username: "u",
      email: "e@x.com",
      oauth_provider: null,
      created_at: "2026-01-01",
    });
    render(
      <AuthProvider>
        <PublicOnlyRoute>
          <div>landing</div>
        </PublicOnlyRoute>
      </AuthProvider>
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("PublicOnlyRoute renders children when unauthenticated", async () => {
    render(
      <AuthProvider>
        <PublicOnlyRoute>
          <div>landing</div>
        </PublicOnlyRoute>
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText("landing")).toBeInTheDocument());
  });

  it("useAuth throws when used outside the provider", () => {
    expect(() => render(<AuthProbe />)).toThrow(/AuthProvider/);
  });
});
