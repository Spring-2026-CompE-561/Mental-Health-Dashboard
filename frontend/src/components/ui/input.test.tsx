import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
  });

  it("supports typing", () => {
    render(<Input placeholder="email" />);
    const el = screen.getByPlaceholderText("email") as HTMLInputElement;
    fireEvent.change(el, { target: { value: "test@example.com" } });
    expect(el.value).toBe("test@example.com");
  });

  it("forwards type attribute", () => {
    render(<Input type="password" placeholder="pwd" />);
    expect(screen.getByPlaceholderText("pwd")).toHaveAttribute("type", "password");
  });

  it("respects focus/blur handlers without crashing", () => {
    render(<Input placeholder="x" />);
    const el = screen.getByPlaceholderText("x");
    fireEvent.focus(el);
    fireEvent.blur(el);
    expect(el).toBeInTheDocument();
  });
});
