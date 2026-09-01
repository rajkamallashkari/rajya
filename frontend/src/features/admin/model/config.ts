export const ADMIN_TABS = ["settings", "flags", "strings", "colours"] as const;
export type AdminTabId = (typeof ADMIN_TABS)[number];

export const ADMIN_SURFACE_ALL = "all";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function formField(data: FormData, name: string): string {
  return String(data.get(name) ?? "");
}

export function parseAccountIds(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((part) => Number(part))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function parseSettingInput(type: string, raw: string): unknown {
  if (type === "integer") {
    return Number.parseInt(raw, 10);
  }
  if (type === "float") {
    return Number.parseFloat(raw);
  }
  if (type === "boolean") {
    return raw === "true";
  }
  if (type === "array" || type === "object") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

export function contrastFailurePair(
  error: unknown,
): { against: string; token: string } | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const nested = error.error;
  const details = isRecord(error.details)
    ? error.details
    : isRecord(nested)
      ? nested.details
      : undefined;
  const pair = isRecord(details) ? details.pair : undefined;
  if (!isRecord(pair)) {
    return isRecord(nested) ? contrastFailurePair(nested) : undefined;
  }
  const token = pair.token;
  const against = pair.against;
  if (typeof token !== "string" || typeof against !== "string") {
    return undefined;
  }
  return { against, token };
}
