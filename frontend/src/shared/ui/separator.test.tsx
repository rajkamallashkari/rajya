import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
  it("renders horizontal and vertical orientations", () => {
    const { rerender } = render(<Separator />);
    expect(document.querySelector('[data-orientation="horizontal"]')).not.toBeNull();
    rerender(<Separator orientation="vertical" decorative={false} />);
    expect(screen.getByRole("separator")).toHaveAttribute("data-orientation", "vertical");
  });
});
