import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChunkFallback } from "./chunk-fallback";
import { en } from "@/shared/lib/i18n/catalog";

describe("ChunkFallback", () => {
  it("announces the loading label", () => {
    render(<ChunkFallback />);
    expect(screen.getByRole("status", { name: en.app.loading })).toBeInTheDocument();
    expect(screen.queryByRole("main")).toBeNull();
  });

  it("wraps a route-level fallback in a main landmark", () => {
    render(<ChunkFallback asPage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: en.app.loading })).toBeInTheDocument();
  });
});
