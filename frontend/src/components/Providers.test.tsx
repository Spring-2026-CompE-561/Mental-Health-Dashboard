import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/services/api", () => ({
  getMe: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import Providers from "./Providers";

describe("Providers", () => {
  it("renders its children inside Theme + Auth providers without crashing", async () => {
    render(
      <Providers>
        <div>hello world</div>
      </Providers>
    );
    await waitFor(() => expect(screen.getByText("hello world")).toBeInTheDocument());
  });
});
