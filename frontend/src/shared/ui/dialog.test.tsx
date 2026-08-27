import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";

describe("Dialog", () => {
  it("opens, shows a close control, and can hide it", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { rerender } = render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>{"Sign out"}</DialogTitle>
          <DialogDescription>{"You can sign back in anytime."}</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));

    rerender(
      <Dialog>
        <DialogTrigger asChild>
          <Button>{"Open dialog"}</Button>
        </DialogTrigger>
        <DialogContent showClose={false}>
          <DialogTitle>{"Sign out"}</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });
});
