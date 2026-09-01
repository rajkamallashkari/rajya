import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChunkFallback } from "./chunk-fallback";
import { en } from "@/shared/lib/i18n/catalog";

describe("ChunkFallback", () => {
  it("announces the loading label", () => {
    render(<ChunkFallback />);
    expect(screen.getByRole("status", { name: en.app.loading })).toBeInTheDocument();
  });
});
