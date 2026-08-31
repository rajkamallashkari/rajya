export const SEARCH_MESSAGE_KINDS = ["text", "image", "video", "audio", "voice", "file"] as const;

export type SearchMessageKind = (typeof SEARCH_MESSAGE_KINDS)[number];

export interface SearchFilters {
  createdAfter?: string;
  createdBefore?: string;
  hasAttachment?: boolean;
  hasLink?: boolean;
  kind?: SearchMessageKind;
  senderAccountId?: number;
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {};

export function filtersActive(filters: SearchFilters): boolean {
  return (
    filters.senderAccountId != null ||
    Boolean(filters.createdAfter) ||
    Boolean(filters.createdBefore) ||
    Boolean(filters.kind) ||
    filters.hasAttachment === true ||
    filters.hasLink === true
  );
}

export function serializeFilters(filters: SearchFilters): string {
  return [
    filters.senderAccountId ?? "",
    filters.createdAfter ?? "",
    filters.createdBefore ?? "",
    filters.kind ?? "",
    filters.hasAttachment === true ? "1" : "",
    filters.hasLink === true ? "1" : "",
  ].join("|");
}

export function toSearchQueryParams(filters: SearchFilters): {
  created_after?: string;
  created_before?: string;
  has_attachment?: boolean;
  has_link?: boolean;
  kind?: string;
  sender_account_id?: number;
} {
  return {
    ...(filters.createdAfter ? { created_after: filters.createdAfter } : {}),
    ...(filters.createdBefore ? { created_before: filters.createdBefore } : {}),
    ...(filters.hasAttachment === true ? { has_attachment: true } : {}),
    ...(filters.hasLink === true ? { has_link: true } : {}),
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(filters.senderAccountId != null ? { sender_account_id: filters.senderAccountId } : {}),
  };
}

export function dateInputValue(iso?: string): string {
  if (!iso) {
    return "";
  }
  return iso.slice(0, 10);
}
