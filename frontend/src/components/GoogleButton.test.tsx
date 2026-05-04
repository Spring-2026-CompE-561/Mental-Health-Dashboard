import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const apiMocks = vi.hoisted(() => ({
  getGoogleAuthUrl: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  getGoogleAuthUrl: apiMocks.getGoogleAuthUrl,
}));

import GoogleButton from "./GoogleButton";

describe("GoogleButton", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    apiMocks.getGoogleAuthUrl.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("renders the default label", () => {
    render(<GoogleButton />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("renders a custom label", () => {
    render(<GoogleButton label="Sign up with Google" />);
    expect(screen.getByRole("button", { name: /sign up with google/i })).toBeInTheDocument();
  });

  it("redirects to the URL returned by the API on click", async () => {
    apiMocks.getGoogleAuthUrl.mockResolvedValueOnce({ url: "https://accounts.google.com/oauth?x=1" });
    render(<GoogleButton />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(window.location.href).toBe("https://accounts.google.com/oauth?x=1")
    );
  });

  it("re-enables the button if the API call fails", async () => {
    // The component logs the error to console.error — silence it for a clean run.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    apiMocks.getGoogleAuthUrl.mockRejectedValueOnce(new Error("nope"));
    render(<GoogleButton />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    await waitFor(() => expect(btn).not.toBeDisabled());
    errSpy.mockRestore();
  });
});
