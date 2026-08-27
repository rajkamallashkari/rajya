import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RadioGroup, RadioGroupItem } from "./radio";

describe("Radio", () => {
  it("selects an option", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <RadioGroup defaultValue="a" aria-label="who">
        <RadioGroupItem value="a" aria-label="everyone" />
        <RadioGroupItem value="b" aria-label="contacts" />
      </RadioGroup>,
    );
    await user.click(screen.getByRole("radio", { name: "contacts" }));
    expect(screen.getByRole("radio", { name: "contacts" })).toBeChecked();
  });
});
