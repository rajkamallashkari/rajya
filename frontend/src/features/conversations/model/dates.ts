export function formatThreadDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

export function sameCalendarDay(left: string, right: string): boolean {
  return new Date(left).toDateString() === new Date(right).toDateString();
}
