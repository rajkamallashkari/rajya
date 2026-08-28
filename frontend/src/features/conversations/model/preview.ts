import type { LastActivityKind, MediaPreviewKind } from "@/features/conversations/model/constants";

export interface LastActivity {
  kind: LastActivityKind;
  mediaType?: MediaPreviewKind;
  senderName?: string | null;
  text: string;
}

export function lastActivityTone(kind: LastActivityKind): "accent" | "italic" | "default" {
  if (kind === "typing") {
    return "accent";
  }
  if (kind === "system") {
    return "italic";
  }
  return "default";
}

export function lastActivityPrefix(activity: LastActivity, isGroup: boolean): string | null {
  if (activity.kind === "typing" || activity.kind === "system") {
    return null;
  }
  if (isGroup && activity.senderName) {
    return activity.senderName;
  }
  return null;
}
