export function inviteUrl(origin: string, token: string): string {
  return `${origin}/invite/${encodeURIComponent(token)}`;
}

export function profileUrl(origin: string, username: string): string {
  return `${origin}/u/${encodeURIComponent(username)}`;
}

export function canManageInvites(kind: string | null | undefined, role: string | null | undefined): boolean {
  return kind !== "direct" && (role === "admin" || role === "owner");
}

export function canEditInfo(
  kind: string | null | undefined,
  role: string | null | undefined,
  editInfo = true,
): boolean {
  return canManageInvites(kind, role) && editInfo;
}
