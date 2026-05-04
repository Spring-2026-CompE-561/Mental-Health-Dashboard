import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import GradientStrip from "./GradientStrip";

describe("GradientStrip", () => {
  it("renders a gradient bar", () => {
    const { container } = render(<GradientStrip />);
    const div = container.firstChild as HTMLElement;
    expect(div).toBeInTheDocument();
    expect(div.style.height).toBe("6px");
    expect(div.style.background).toMatch(/linear-gradient/);
  });
});
