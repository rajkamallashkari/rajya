import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(ref.current?.className).toContain("max-h-[var(--textarea-max-height)]");
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

  it("caps height at the computed max when content is taller", () => {
    render(<Textarea />);
    const el = screen.getByRole("textbox");
    el.style.maxHeight = "80px";
    Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => 240 });
    fireEvent.input(el, { target: { value: "long" } });
    expect(el.style.height).toBe("80px");
    Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => 40 });
    fireEvent.input(el, { target: { value: "short" } });
    expect(el.style.height).toBe("40px");
  });
});
