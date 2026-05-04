import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "./label";

describe("Label", () => {
  it("renders as a <label>", () => {
    render(<Label htmlFor="email">Email</Label>);
    const label = screen.getByText("Email");
    expect(label.tagName.toLowerCase()).toBe("label");
    expect(label).toHaveAttribute("for", "email");
  });

  it("merges custom className", () => {
    render(<Label className="custom-cls">L</Label>);
    expect(screen.getByText("L")).toHaveClass("custom-cls");
  });
});
