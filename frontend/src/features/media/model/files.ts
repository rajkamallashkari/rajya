import { BYTE_UNITS, FILENAME_TRUNCATE } from "@/features/media/model/constants";

export type FileKindKey = "pdf" | "word" | "sheet" | "slides" | "archive" | "code" | "file";

const KIND_BY_EXT: Record<string, FileKindKey> = {
  pdf: "pdf",
  doc: "word",
  docx: "word",
  odt: "word",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  ods: "sheet",
  ppt: "slides",
  pptx: "slides",
  odp: "slides",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  js: "code",
  ts: "code",
  jsx: "code",
  tsx: "code",
  py: "code",
  rb: "code",
  go: "code",
  rs: "code",
  java: "code",
};

export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) {
    return "";
  }
  return filename.slice(dot + 1).toLowerCase();
}

export function fileKindKey(filename: string): FileKindKey {
  return KIND_BY_EXT[fileExtension(filename)] ?? "file";
}

export function formatByteSize(bytes: number): { value: string; unit: "b" | "kb" | "mb" } {
  if (bytes < BYTE_UNITS) {
    return { value: String(bytes), unit: "b" };
  }
  if (bytes < BYTE_UNITS * BYTE_UNITS) {
    return { value: (bytes / BYTE_UNITS).toFixed(1), unit: "kb" };
  }
  return { value: (bytes / (BYTE_UNITS * BYTE_UNITS)).toFixed(1), unit: "mb" };
}

export function truncateFilename(name: string, max: number = FILENAME_TRUNCATE): string {
  if (name.length <= max) {
    return name;
  }
  return `${name.slice(0, max - 1)}…`;
}

export function displayFilename(filename: string | null | undefined, contentType: string): string {
  if (filename && filename.length > 0) {
    return filename;
  }
  const subtype = contentType.split("/")[1];
  return subtype && subtype.length > 0 ? `file.${subtype}` : "file.bin";
}
