import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";

describe("Card primitives", () => {
  it("Card renders children", () => {
    render(<Card>hello</Card>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("CardHeader, CardTitle, CardContent compose correctly", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>title</CardTitle>
        </CardHeader>
        <CardContent>body</CardContent>
      </Card>
    );
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("merges className on Card", () => {
    const { container } = render(<Card className="my-card">x</Card>);
    expect(container.firstChild).toHaveClass("my-card");
  });
});
