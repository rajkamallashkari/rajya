import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

describe("Select", () => {
  it("opens and chooses an item", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Select defaultValue="apple">
        <SelectTrigger aria-label="fruit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">{"Apple"}</SelectItem>
          <SelectItem value="orange">{"Orange"}</SelectItem>
        </SelectContent>
      </Select>,
    );
    await user.click(screen.getByRole("combobox", { name: "fruit" }));
    await user.click(await screen.findByRole("option", { name: "Orange" }));
    expect(screen.getByRole("combobox")).toHaveTextContent("Orange");
  });

  it("supports item-aligned positioning", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Select>
        <SelectTrigger aria-label="pick">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          <SelectItem value="apple">{"Apple"}</SelectItem>
        </SelectContent>
      </Select>,
    );
    await user.click(screen.getByRole("combobox", { name: "pick" }));
    expect(await screen.findByRole("option", { name: "Apple" })).toBeInTheDocument();
  });
});
