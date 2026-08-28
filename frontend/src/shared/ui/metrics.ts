export const FOCUS_RING =
  "focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-offset-[length:var(--focus-ring-offset)] focus-visible:outline-[var(--accent)]";

export const CONTROL_DISABLED = "disabled:opacity-[var(--opacity-disabled)]";

export const CONTROL_SURFACE =
  "rounded-[var(--control-radius)] border border-[var(--border-default)] bg-[var(--surface-input)] text-[var(--text-primary)]";

export const ICON_CLASS = "h-[var(--icon-size)] w-[var(--icon-size)]";

export const WEIGHT_EMPHASIS = "[font-weight:var(--font-weight-emphasis)]";

export const MENU_CONTENT_CLASS =
  "z-[var(--z-menu)] w-max min-w-[var(--menu-min-width)] overflow-hidden rounded-[var(--control-radius)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-[var(--space-1)] text-[var(--text-primary)] shadow-[var(--elevation-2)]";

export const MENU_ITEM_CLASS =
  "flex min-h-[var(--control-height)] cursor-default select-none items-center justify-start whitespace-nowrap text-left rounded-[var(--radius-sm)] px-[var(--control-pad-x-sm)] outline-none data-[highlighted]:bg-[var(--surface-hover)] data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--opacity-disabled)]";

export const MENU_ITEM_DANGER_CLASS =
  "text-[var(--status-danger)] data-[highlighted]:bg-[var(--status-danger-subtle)]";

export const OVERLAY_SCRIM = "fixed inset-0 bg-[var(--overlay-scrim)] ui-scrim";

export const PAGE_INSET =
  "pt-[max(var(--inset-page),var(--safe-area-top))] pr-[max(var(--inset-page),var(--safe-area-right))] pb-[max(var(--inset-page),var(--safe-area-bottom))] pl-[max(var(--inset-page),var(--safe-area-left))]";

export const AVATAR_TONES = [
  "--accent",
  "--status-info",
  "--status-success",
  "--status-warning",
] as const;

export const AVATAR_INITIALS_LENGTH = 2;
export const PROGRESS_MIN = 0;
export const PROGRESS_MAX = 100;
export const PROGRESS_RING_RADIUS = 16;
export const PROGRESS_RING_STROKE = 3;
export const TEXTAREA_MIN_ROWS = 1;
export const TOAST_DURATION_MS = 4000;
export const TOOLTIP_DELAY_MS = 140;
export const SCROLL_DEMO_ROWS = 8;
export const SLIDER_STEP = 1;
export const POPOVER_OFFSET_PX = 6;
