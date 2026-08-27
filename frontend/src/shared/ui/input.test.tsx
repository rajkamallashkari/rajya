import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("forwards type, className and ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} type="email" className="extra" placeholder="mail" />);
    const input = screen.getByPlaceholderText("mail");
    expect(input).toHaveAttribute("type", "email");
    expect(input.className).toContain("extra");
    expect(ref.current).toBe(input);
  });
});
