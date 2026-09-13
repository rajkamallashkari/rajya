import {
  DEFAULT_DATE_TIME_PREFERENCES,
  formatPreferenceDate,
} from "@/shared/lib/date-time";

export function formatThreadDate(iso: string, locale: string): string {
  return formatPreferenceDate(iso, locale, DEFAULT_DATE_TIME_PREFERENCES);
}

export function sameCalendarDay(left: string, right: string): boolean {
  return new Date(left).toDateString() === new Date(right).toDateString();
}
