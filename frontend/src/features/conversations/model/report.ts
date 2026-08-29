export const REPORT_SUBJECTS = ["message", "account", "conversation", "bot"] as const;
export type ReportSubjectType = (typeof REPORT_SUBJECTS)[number];

export interface ReportReason {
  id: string;
  label: string;
}

export interface SessionView {
  current: boolean;
  deviceLabel: string | null;
  expiresAt: string;
  id: string;
  ip: string | null;
  lastSeenAt: string;
  revoked: boolean;
  userAgent: string | null;
}

export const LOCATION_REQUEST_CAP = 8;

export type TranscriptStatus = "pending" | "ready" | "failed";
