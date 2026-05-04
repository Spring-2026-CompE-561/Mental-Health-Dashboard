import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Press</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies the disabled attribute", () => {
    render(<Button disabled>Off</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("respects variant prop in className", () => {
    render(<Button variant="pink">P</Button>);
    expect(screen.getByRole("button").className).toMatch(/f9b2d7/);
  });

  it("respects size prop", () => {
    render(<Button size="sm">S</Button>);
    expect(screen.getByRole("button").className).toMatch(/h-\[40px\]/);
  });

  it("renders as child slot when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/x">Link button</a>
      </Button>
    );
    expect(screen.getByRole("link", { name: /link button/i })).toHaveAttribute("href", "/x");
  });
});
