import type { LastActivityKind, MediaPreviewKind } from "@/features/conversations/model/constants";
import type { components } from "@/shared/lib/api/schema";

type MessagePreview = components["schemas"]["MessagePreview"];

export interface LastActivity {
  kind: LastActivityKind;
  mediaType?: MediaPreviewKind;
  senderName?: string | null;
  text: string;
}

const MEDIA_KINDS: Record<string, MediaPreviewKind> = {
  audio: "audio",
  file: "file",
  image: "image",
  video: "video",
  voice: "audio",
};

export function lastActivityFromPreview(
  preview: MessagePreview | undefined,
  deletedLabel: string,
): LastActivity {
  if (!preview) {
    return { kind: "text", text: "" };
  }
  if (preview.deleted) {
    return { kind: "text", senderName: preview.sender_name, text: deletedLabel };
  }
  if (preview.kind === "system") {
    return { kind: "system", text: preview.body ?? "" };
  }
  const mediaType = MEDIA_KINDS[preview.kind];
  if (mediaType) {
    return { kind: "media", mediaType, senderName: preview.sender_name, text: "" };
  }
  return { kind: "text", senderName: preview.sender_name, text: preview.body ?? "" };
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
