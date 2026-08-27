import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("grows on input and forwards an object ref", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLTextAreaElement>();
    const onInput = vi.fn();
    render(<Textarea ref={ref} onInput={onInput} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    await user.type(screen.getByRole("textbox"), "hello");
    expect(onInput).toHaveBeenCalled();
  });

  it("forwards a callback ref and resizes when value changes", () => {
    const callback = vi.fn();
    const { rerender } = render(<Textarea ref={callback} value="a" onChange={() => undefined} />);
    expect(callback).toHaveBeenCalled();
    rerender(<Textarea value="abcdef" onChange={() => undefined} />);
    expect(screen.getByRole("textbox")).toHaveValue("abcdef");
  });
});
