import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "../components/ui/button";

describe("UI Components", () => {
  it("renders a button with correct text", () => {
    render(<Button>Click me</Button>);
    const buttonElement = screen.getByText("Click me");
    expect(buttonElement).toBeInTheDocument();
  });
});
