import { PROGRESS_MAX, PROGRESS_MIN } from "@/shared/ui/metrics";

export type PendingUploadStatus = "pending" | "uploading" | "done" | "failed";

export interface PendingUpload {
  id: string;
  name: string;
  progress: number;
  previewUrl?: string | null;
  status: PendingUploadStatus;
}

export function uploadProgressWidth(progress: number): string {
  return `${String(Math.min(PROGRESS_MAX, Math.max(PROGRESS_MIN, progress)))}%`;
}

export function isPreviewableName(name: string, contentType?: string): boolean {
  if (contentType?.startsWith("image/") || contentType?.startsWith("video/")) {
    return true;
  }
  return /\.(png|jpe?g|gif|webp|mp4|webm)$/i.test(name);
}
