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
