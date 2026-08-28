import {
  UNREAD_TIER_DOUBLE,
  UNREAD_TIER_SINGLE,
  UNREAD_TIER_TRIPLE,
} from "@/features/conversations/model/constants";

export function formatUnread(count: number): string {
  if (count <= 0) {
    return "";
  }
  if (count < UNREAD_TIER_SINGLE) {
    return String(count);
  }
  if (count < UNREAD_TIER_DOUBLE) {
    return "9+";
  }
  if (count < UNREAD_TIER_TRIPLE) {
    return "99+";
  }
  return "999+";
}
