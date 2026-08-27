import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { dismissToast, getToast, showToast, subscribeToasts, Toaster } from "./toast";

afterEach(() => {
  dismissToast();
});

describe("toast", () => {
  it("shows, variants, dismisses and unsubscribes", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let ticks = 0;
    const stop = subscribeToasts(() => {
      ticks += 1;
    });
    render(<Toaster />);
    showToast({ title: "Saved", description: "Stored" });
    expect(getToast()?.title).toBe("Saved");
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Stored")).toBeInTheDocument();
    showToast({ title: "Boom", variant: "danger" });
    expect(await screen.findByText("Boom")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByText("Boom")).toBeNull());
    const before = ticks;
    stop();
    showToast({ title: "Ignored" });
    expect(ticks).toBe(before);
    expect(getToast()?.title).toBe("Ignored");
    dismissToast();
    expect(getToast()).toBeNull();
  });
});
