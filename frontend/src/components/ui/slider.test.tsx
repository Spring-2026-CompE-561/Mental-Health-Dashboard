import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Slider } from "./slider";

describe("Slider", () => {
  it("renders a range input", () => {
    render(<Slider value={5} onValueChange={() => {}} />);
    const input = screen.getByRole("slider") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "range");
  });

  it("respects min, max and step", () => {
    render(<Slider value={2} onValueChange={() => {}} min={0} max={10} step={1} />);
    const input = screen.getByRole("slider") as HTMLInputElement;
    expect(input.min).toBe("0");
    expect(input.max).toBe("10");
    expect(input.step).toBe("1");
  });

  it("calls onValueChange with a number", () => {
    const onChange = vi.fn();
    render(<Slider value={3} onValueChange={onChange} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "7" } });
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("can be disabled", () => {
    render(<Slider value={5} onValueChange={() => {}} disabled />);
    expect(screen.getByRole("slider")).toBeDisabled();
  });
});
