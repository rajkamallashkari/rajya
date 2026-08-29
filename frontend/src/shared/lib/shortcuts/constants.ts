export const SHORTCUTS = {
  editLast: "ArrowUp",
  focusSearch: "/",
  popLayer: "Escape",
  send: "Enter",
} as const;

export type ShortcutKey = (typeof SHORTCUTS)[keyof typeof SHORTCUTS];
