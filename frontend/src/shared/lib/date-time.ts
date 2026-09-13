import type { PreferenceLocale } from "@/shared/lib/config/preferences-registry";

export interface DateTimeFormatPreferences {
  dateFormat: PreferenceLocale["date_format"];
  timeFormat: PreferenceLocale["time_format"];
}

export const DEFAULT_DATE_TIME_PREFERENCES: DateTimeFormatPreferences = {
  dateFormat: "MMM D, YYYY",
  timeFormat: "12h",
};

const DATE_PARTS: Record<
  PreferenceLocale["date_format"],
  { order: ("day" | "month" | "year" | "weekday")[]; month: "2-digit" | "short" | "long"; separator: string }
> = {
  "YYYY-MM-DD": { order: ["year", "month", "day"], month: "2-digit", separator: "-" },
  "MM/DD/YYYY": { order: ["month", "day", "year"], month: "2-digit", separator: "/" },
  "DD/MM/YYYY": { order: ["day", "month", "year"], month: "2-digit", separator: "/" },
  "DD-MM-YYYY": { order: ["day", "month", "year"], month: "2-digit", separator: "-" },
  "MMM D, YYYY": { order: ["month", "day", "year"], month: "short", separator: " " },
  "D MMM YYYY": { order: ["day", "month", "year"], month: "short", separator: " " },
  "MMMM D, YYYY": { order: ["month", "day", "year"], month: "long", separator: " " },
  "D MMMM YYYY": { order: ["day", "month", "year"], month: "long", separator: " " },
  "ddd, MMM D, YYYY": {
    order: ["weekday", "month", "day", "year"],
    month: "short",
    separator: " ",
  },
  "MM.DD.YYYY": { order: ["month", "day", "year"], month: "2-digit", separator: "." },
  "DD.MM.YYYY": { order: ["day", "month", "year"], month: "2-digit", separator: "." },
};

function dateParts(
  value: Date | string | number,
  locale: string,
  preferences: DateTimeFormatPreferences,
): Record<string, string> {
  const pattern = DATE_PARTS[preferences.dateFormat];
  return Object.fromEntries(
    new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: pattern.month,
      weekday: pattern.order.includes("weekday") ? "short" : undefined,
      year: "numeric",
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
}

export function formatPreferenceDate(
  value: Date | string | number,
  locale: string,
  preferences: DateTimeFormatPreferences,
): string {
  const pattern = DATE_PARTS[preferences.dateFormat];
  const parts = dateParts(value, locale, preferences);
  const ordered = pattern.order.map((part) => parts[part]);
  if (preferences.dateFormat === "MMM D, YYYY" || preferences.dateFormat === "MMMM D, YYYY") {
    return `${ordered[0]} ${Number(ordered[1])}, ${ordered[2]}`;
  }
  if (preferences.dateFormat === "ddd, MMM D, YYYY") {
    return `${ordered[0]}, ${ordered[1]} ${Number(ordered[2])}, ${ordered[3]}`;
  }
  if (pattern.month !== "2-digit") {
    ordered[0] = String(Number(ordered[0]));
  }
  return ordered.join(pattern.separator);
}

export function formatPreferenceTime(
  value: Date | string | number,
  locale: string,
  preferences: DateTimeFormatPreferences,
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    hour12: preferences.timeFormat === "12h",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatPreferenceDateTime(
  value: Date | string | number,
  locale: string,
  preferences: DateTimeFormatPreferences,
): string {
  return `${formatPreferenceDate(value, locale, preferences)}, ${formatPreferenceTime(value, locale, preferences)}`;
}

export function formatPreferenceCompact(
  value: Date | string | number,
  locale: string,
  preferences: DateTimeFormatPreferences,
  now: Date | string | number = Date.now(),
): string {
  const date = new Date(value);
  const today = new Date(now);
  return date.toDateString() === today.toDateString()
    ? formatPreferenceTime(date, locale, preferences)
    : formatPreferenceDate(date, locale, preferences);
}
