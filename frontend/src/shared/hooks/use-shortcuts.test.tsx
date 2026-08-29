import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useShortcuts } from "./use-shortcuts";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";

function Harness({
  onEditLast,
  onFocusSearch,
  onPopLayer,
  searchRef,
}: {
  onEditLast?: () => void;
  onFocusSearch?: () => void;
  onPopLayer?: () => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
}) {
  useShortcuts({ onEditLast, onFocusSearch, onPopLayer, searchRef });
  return (
    <div>
      <input aria-label="field" />
      <div role="menu">{"menu"}</div>
    </div>
  );
}

describe("useShortcuts", () => {
  it("dispatches pop, search, and edit, and ignores typing and menus", () => {
    const onEditLast = vi.fn();
    const onFocusSearch = vi.fn();
    const onPopLayer = vi.fn();
    const searchRef = createRef<HTMLInputElement>();
    const { rerender } = render(
      <Harness
        onEditLast={onEditLast}
        onFocusSearch={onFocusSearch}
        onPopLayer={onPopLayer}
        searchRef={searchRef}
      />,
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(onPopLayer).not.toHaveBeenCalled();
    rerender(<div>{null}</div>);
    render(
      <Harness
        onEditLast={onEditLast}
        onFocusSearch={onFocusSearch}
        onPopLayer={onPopLayer}
        searchRef={searchRef}
      />,
    );
    document.querySelector("[role='menu']")?.remove();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.popLayer, bubbles: true }));
    expect(onPopLayer).toHaveBeenCalled();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: SHORTCUTS.focusSearch, bubbles: true }),
    );
    expect(onFocusSearch).toHaveBeenCalled();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: SHORTCUTS.editLast, bubbles: true }));
    expect(onEditLast).toHaveBeenCalled();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: SHORTCUTS.focusSearch, metaKey: true, bubbles: true }),
    );
    const field = document.querySelector("input");
    field?.dispatchEvent(
      new KeyboardEvent("keydown", { key: SHORTCUTS.focusSearch, bubbles: true }),
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    const prevented = new KeyboardEvent("keydown", {
      key: SHORTCUTS.editLast,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(prevented, "defaultPrevented", { get: () => true });
    window.dispatchEvent(prevented);
  });
});
