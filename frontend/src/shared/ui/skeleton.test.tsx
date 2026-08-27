import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("is decorative", () => {
    const { container } = render(<Skeleton className="h-[var(--space-4)]" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
