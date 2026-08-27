import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "./bottom-sheet";

describe("BottomSheet", () => {
  it("opens from the trigger", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <BottomSheet>
        <BottomSheetTrigger asChild>
          <Button>{"Open sheet"}</Button>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetTitle>{"Filters"}</BottomSheetTitle>
        </BottomSheetContent>
      </BottomSheet>,
    );
    await user.click(screen.getByRole("button", { name: "Open sheet" }));
    expect(await screen.findByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Filters").closest("[role='dialog']")?.className).toContain(
      "min-h-[var(--sheet-min-height)]",
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
  });
});
