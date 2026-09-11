const FALLBACK_VOICE_MIME = "audio/webm";

export function voiceExtensionForMime(mimeType: string): string {
  if (mimeType.includes("mp4")) {
    return "m4a";
  }
  if (mimeType.includes("ogg")) {
    return "ogg";
  }
  return "weba";
}

export function voiceContentType(mimeType: string): string {
  const type = mimeType.replace(/;.*$/, "").trim();
  return type || FALLBACK_VOICE_MIME;
}

export function voiceFileFromBlob(blob: Blob, mimeType: string): File {
  const type = voiceContentType(mimeType || blob.type || FALLBACK_VOICE_MIME);
  const extension = voiceExtensionForMime(type);
  return new File([blob], `voice_${String(Date.now())}.${extension}`, { type });
}
