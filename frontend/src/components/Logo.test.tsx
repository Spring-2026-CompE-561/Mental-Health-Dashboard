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

  it("respects custom stroke color", () => {
    const { container } = render(<Logo stroke="#abcdef" />);
    expect(container.querySelector("circle[r='14']")?.getAttribute("stroke")).toBe("#abcdef");
  });
});
