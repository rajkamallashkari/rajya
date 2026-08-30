import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReminderSheet } from "./reminder-sheet";
import { en } from "@/shared/lib/i18n/catalog";

describe("ReminderSheet", () => {
  it("submits a reminder time and note", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    render(<ReminderSheet onOpenChange={onOpenChange} onSubmit={onSubmit} open />);
    await user.clear(screen.getByLabelText(en.reminders.note));
    await user.type(screen.getByLabelText(en.reminders.note), "Ping");
    fireEvent.change(screen.getByLabelText(en.reminders.when), {
      target: { value: "2099-01-15T09:00" },
    });
    await user.click(screen.getByRole("button", { name: en.reminders.save }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ note: "Ping", remindAt: expect.any(String) }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
