import { MS_PER_DAY, SEARCH_WEEK_DAYS } from "@/features/search/model/constants";

export type JumpDateKind = "today" | "yesterday" | "week";

export function jumpDateIso(kind: JumpDateKind, now: number): string {
  const days = kind === "today" ? 0 : kind === "yesterday" ? 1 : SEARCH_WEEK_DAYS;
  return new Date(now - days * MS_PER_DAY).toISOString();
}

export function startOfDayIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return new Date(parsed).toISOString();
}

export function endOfDayIso(value: string): string | null {
  const start = startOfDayIso(value);
  if (!start) {
    return null;
  }
  return new Date(Date.parse(start) + MS_PER_DAY - 1).toISOString();
}
