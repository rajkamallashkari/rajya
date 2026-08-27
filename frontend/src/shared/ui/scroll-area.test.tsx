import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
  it("renders overflow content", () => {
    render(
      <ScrollArea className="h-[var(--space-16)]">
        <p>{"Row 1"}</p>
      </ScrollArea>,
    );
    expect(screen.getByText("Row 1")).toBeInTheDocument();
  });
});
