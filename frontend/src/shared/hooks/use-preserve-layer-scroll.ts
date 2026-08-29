import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const SCROLL_SELECTOR = "[data-layer-scroll]";

function scrollKey(node: HTMLElement): string {
  return String(node.getAttribute("data-layer-scroll"));
}

function captureScroll(root: HTMLElement, dest: Map<string, number>): void {
  for (const node of root.querySelectorAll<HTMLElement>(SCROLL_SELECTOR)) {
    dest.set(scrollKey(node), node.scrollTop);
  }
}

function restoreScroll(root: HTMLElement, src: Map<string, number>): void {
  for (const node of root.querySelectorAll<HTMLElement>(SCROLL_SELECTOR)) {
    const top = src.get(scrollKey(node));
    if (top !== undefined) {
      node.scrollTop = top;
    }
  }
}

function writeSnapshot(root: HTMLElement, dest: Map<string, number>): void {
  root.setAttribute("data-layer-scroll-snapshot", String(dest.get("base") ?? ""));
}

export function usePreserveLayerScroll(ref: RefObject<HTMLElement | null>, active: boolean): void {
  const positions = useRef(new Map<string, number>());
  const locked = useRef(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return undefined;
    }
    const onScroll = (event: Event): void => {
      if (locked.current || root.hasAttribute("inert")) {
        return;
      }
      const target = event.currentTarget as HTMLElement;
      positions.current.set(scrollKey(target), target.scrollTop);
      writeSnapshot(root, positions.current);
    };
    const onPointerDown = (): void => {
      if (root.hasAttribute("inert")) {
        return;
      }
      captureScroll(root, positions.current);
      locked.current = true;
      writeSnapshot(root, positions.current);
    };
    const scrollers = [...root.querySelectorAll<HTMLElement>(SCROLL_SELECTOR)];
    for (const node of scrollers) {
      node.addEventListener("scroll", onScroll);
    }
    root.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      for (const node of scrollers) {
        node.removeEventListener("scroll", onScroll);
      }
      root.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [ref]);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !active) {
      return;
    }
    restoreScroll(root, positions.current);
    locked.current = false;
  }, [active, ref]);
}
