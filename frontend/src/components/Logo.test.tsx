import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import Logo from "./Logo";

describe("Logo", () => {
  it("renders an SVG with default size", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("44");
    expect(svg?.getAttribute("height")).toBe("44");
  });

  it("respects custom size", () => {
    const { container } = render(<Logo size={64} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("64");
    expect(svg?.getAttribute("height")).toBe("64");
  });

  it("respects custom stroke color on the halo ring", () => {
    const { container } = render(<Logo stroke="#abcdef" />);
    // The outermost halo circle is the largest one in the SVG.
    const halo = container.querySelector("circle[r='19']");
    expect(halo?.getAttribute("stroke")).toBe("#abcdef");
  });

  it("exposes an accessible label so screen readers describe the mark", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label") ?? "").toMatch(/lotus|breath|logo/i);
  });
});
