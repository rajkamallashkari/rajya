import { MS_PER_DAY, SEARCH_WEEK_DAYS } from "@/features/search/model/constants";

export type JumpDateKind = "today" | "yesterday" | "week";

export function jumpDateIso(kind: JumpDateKind, now: number): string {
  const days = kind === "today" ? 0 : kind === "yesterday" ? 1 : SEARCH_WEEK_DAYS;
  return new Date(now - days * MS_PER_DAY).toISOString();
}

export function localDateInputValue(value: Date | number = Date.now()): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localDateOffset(days: number, now: number = Date.now()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return localDateInputValue(date);
}

function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year!, month! - 1, day!);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month! - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export function startOfDayIso(value: string): string | null {
  return parseLocalDate(value)?.toISOString() ?? null;
}

export function endOfDayIso(value: string): string | null {
  const parsed = parseLocalDate(value);
  if (!parsed) {
    return null;
  }
  parsed.setDate(parsed.getDate() + 1);
  parsed.setMilliseconds(-1);
  return parsed.toISOString();
}
