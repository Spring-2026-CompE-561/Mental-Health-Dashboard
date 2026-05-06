import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";

function ThemeProbe() {
  const { theme, isDark, toggleTheme, followsSystem } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="is-dark">{String(isDark)}</span>
      <span data-testid="follows-system">{String(followsSystem)}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

/**
 * Helper to override `window.matchMedia` so tests can simulate the OS being
 * in either light or dark mode. Returns a cleanup function.
 */
function mockSystemPreference(prefersDark: boolean) {
  const original = window.matchMedia;
  const mql = {
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi.fn().mockImplementation(() => mql);
  return () => {
    window.matchMedia = original;
  };
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when the user is NOT authenticated", () => {
    it("follows the OS when the OS prefers light", () => {
      const restore = mockSystemPreference(false);
      render(
        <ThemeProvider isAuthenticated={false}>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme").textContent).toBe("light");
      expect(screen.getByTestId("follows-system").textContent).toBe("true");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      restore();
    });

    it("follows the OS when the OS prefers dark", () => {
      const restore = mockSystemPreference(true);
      render(
        <ThemeProvider isAuthenticated={false}>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme").textContent).toBe("dark");
      expect(screen.getByTestId("follows-system").textContent).toBe("true");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      restore();
    });

    it("ignores any saved preference in localStorage", () => {
      localStorage.setItem("theme", "dark");
      const restore = mockSystemPreference(false);
      render(
        <ThemeProvider isAuthenticated={false}>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme").textContent).toBe("light");
      expect(screen.getByTestId("follows-system").textContent).toBe("true");
      restore();
    });

    it("toggleTheme is a no-op", () => {
      const restore = mockSystemPreference(false);
      render(
        <ThemeProvider isAuthenticated={false}>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme").textContent).toBe("light");
      act(() => {
        screen.getByText("toggle").click();
      });
      expect(screen.getByTestId("theme").textContent).toBe("light");
      expect(localStorage.getItem("theme")).toBeNull();
      restore();
    });
  });

  describe("when the user IS authenticated", () => {
    it("follows the OS until a preference is saved", () => {
      const restore = mockSystemPreference(true);
      render(
        <ThemeProvider isAuthenticated={true}>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme").textContent).toBe("dark");
      expect(screen.getByTestId("follows-system").textContent).toBe("true");
      restore();
    });

    it("respects a stored preference in localStorage", () => {
      localStorage.setItem("theme", "dark");
      const restore = mockSystemPreference(false);
      render(
        <ThemeProvider isAuthenticated={true}>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme").textContent).toBe("dark");
      expect(screen.getByTestId("follows-system").textContent).toBe("false");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      restore();
    });

    it("toggleTheme flips theme and persists to localStorage", () => {
      const restore = mockSystemPreference(false);
      render(
        <ThemeProvider isAuthenticated={true}>
          <ThemeProbe />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme").textContent).toBe("light");
      act(() => {
        screen.getByText("toggle").click();
      });
      expect(screen.getByTestId("theme").textContent).toBe("dark");
      expect(localStorage.getItem("theme")).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      act(() => {
        screen.getByText("toggle").click();
      });
      expect(screen.getByTestId("theme").textContent).toBe("light");
      expect(localStorage.getItem("theme")).toBe("light");
      restore();
    });
  });

  it("throws when useTheme is called outside the provider", () => {
    expect(() => render(<ThemeProbe />)).toThrow(/ThemeProvider/);
  });
});
