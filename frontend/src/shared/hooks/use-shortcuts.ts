import { useEffect, type RefObject } from "react";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

export function useShortcuts({
  onEditLast,
  onFocusSearch,
  onPopLayer,
  searchRef,
}: {
  onEditLast?: () => void;
  onFocusSearch?: () => void;
  onPopLayer?: () => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key === SHORTCUTS.popLayer) {
        if (document.querySelector("[role='menu']")) {
          return;
        }
        onPopLayer?.();
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      if (event.key === SHORTCUTS.focusSearch) {
        event.preventDefault();
        onFocusSearch?.();
        searchRef?.current?.focus();
        return;
      }
      if (event.key === SHORTCUTS.editLast) {
        event.preventDefault();
        onEditLast?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEditLast, onFocusSearch, onPopLayer, searchRef]);
}
