import { REPORT_AGE_HOURS } from "./constants";

export function displayMetric(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value == null) {
    return "";
  }
  return JSON.stringify(value);
}

export function queryListStatus(
  pending: boolean,
  error: boolean,
  empty: boolean,
): "loading" | "empty" | "error" | "ready" {
  if (pending) {
    return "loading";
  }
  if (error) {
    return "error";
  }
  if (empty) {
    return "empty";
  }
  return "ready";
}

export function parseReportAgeHours(value: string): number | undefined {
  if (value === "day") {
    return REPORT_AGE_HOURS.day;
  }
  if (value === "week") {
    return REPORT_AGE_HOURS.week;
  }
  if (value === "month") {
    return REPORT_AGE_HOURS.month;
  }
  return undefined;
}
