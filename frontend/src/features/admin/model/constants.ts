export const REPORT_STATUSES = ["pending", "reviewing", "actioned", "dismissed"] as const;
export const REPORT_SUBJECT_TYPES = ["message", "account", "conversation", "bot"] as const;

export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 30;

export const REPORT_AGE_HOURS = {
  day: HOURS_PER_DAY,
  week: HOURS_PER_DAY * DAYS_PER_WEEK,
  month: HOURS_PER_DAY * DAYS_PER_MONTH,
} as const;

export type ReportAgeKey = keyof typeof REPORT_AGE_HOURS;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type ReportSubjectType = (typeof REPORT_SUBJECT_TYPES)[number];
