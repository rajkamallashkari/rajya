import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./logo";

describe("Logo", () => {
  it("uses the light mark on a dark theme", () => {
    render(<Logo resolvedTheme="dark" />);
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Rajya");
    expect(screen.getByRole("img").getAttribute("src")).toContain("logo_light");
  });

  it("uses the dark mark on a light theme", () => {
    render(<Logo resolvedTheme="light" />);
    expect(screen.getByRole("img").getAttribute("src")).toContain("logo_dark");
  });
});
