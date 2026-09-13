import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BioContent } from "./bio-content";

describe("BioContent", () => {
  it("linkifies safe web URLs without interpreting other profile formatting", () => {
    const { container } = render(
      <BioContent>
        {"First line\nhttps://example.com/docs.\n**plain** javascript:alert(1)"}
      </BioContent>,
    );

    const link = screen.getByRole("link", { name: "https://example.com/docs" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container).toHaveTextContent("**plain** javascript:alert(1)");
    expect(container.querySelector("[data-bio-content]")).toHaveClass("whitespace-pre-wrap");
  });
});
