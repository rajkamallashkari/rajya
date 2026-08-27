import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders optional slots", () => {
    const { rerender } = render(<EmptyState title="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    rerender(
      <EmptyState
        title="Empty"
        description="Start a chat"
        icon={<span>{"i"}</span>}
        action={<Button>{"New"}</Button>}
      />,
    );
    expect(screen.getByText("Start a chat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
    expect(screen.getByText("i")).toBeInTheDocument();
  });
});
