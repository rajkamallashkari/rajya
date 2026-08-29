import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListSkeleton } from "./list-skeleton";
import { ListView } from "./list-view";
import { Button } from "./button";
import { en } from "@/shared/lib/i18n/catalog";

describe("list states", () => {
  it("renders loading, empty, error, and ready", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<ListSkeleton rows={2} />);
    expect(screen.getByRole("status", { name: en.lists.loading })).toBeInTheDocument();
    rerender(
      <ListView action={<Button>{"go"}</Button>} status="empty">
        <p>{"hidden"}</p>
      </ListView>,
    );
    expect(screen.getByText(en.lists.empty_title)).toBeInTheDocument();
    rerender(
      <ListView onRetry={onRetry} status="error">
        <p>{"hidden"}</p>
      </ListView>,
    );
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(onRetry).toHaveBeenCalled();
    rerender(
      <ListView status="ready">
        <p>{"rows"}</p>
      </ListView>,
    );
    expect(screen.getByText("rows")).toBeInTheDocument();
    rerender(<ListView status="loading">{null}</ListView>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
