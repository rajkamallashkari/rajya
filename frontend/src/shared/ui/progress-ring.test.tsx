import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { clampProgress, ProgressRing } from "./progress-ring";
import { PROGRESS_MAX, PROGRESS_MIN } from "./metrics";

describe("ProgressRing", () => {
  it("clamps values and exposes progress semantics", () => {
    expect(clampProgress(-8)).toBe(PROGRESS_MIN);
    expect(clampProgress(PROGRESS_MAX + 8)).toBe(PROGRESS_MAX);
    expect(clampProgress(40)).toBe(40);
    render(<ProgressRing value={40} label="Upload" />);
    expect(screen.getByRole("progressbar", { name: "Upload" })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });
});
