import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryDisclosure, MemoryNotice } from "./memory-disclosure";
import { en } from "@/shared/lib/i18n/catalog";

describe("DS-1 disclosure", () => {
  it("renders the profile line", () => {
    render(<MemoryDisclosure />);
    expect(screen.getByText(en.bots.memory_disclosure)).toBeInTheDocument();
    expect(en.bots.memory_disclosure).toBe("Remembers what everyone tells it");
  });

  it("renders the first-message notice", () => {
    render(<MemoryNotice />);
    expect(screen.getByText(en.bots.memory_notice)).toBeInTheDocument();
  });
});
