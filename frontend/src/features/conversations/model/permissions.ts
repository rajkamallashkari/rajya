export const MEMBER_PERMISSION_KEYS = [
  "add_members",
  "create_invites",
  "create_polls",
  "edit_info",
  "mention_everyone",
  "pin_messages",
  "send_media",
  "send_messages",
] as const;

export const PERMISSION_ROLES = ["member", "admin", "owner"] as const;

export type MemberPermissionKey = (typeof MEMBER_PERMISSION_KEYS)[number];
export type PermissionRole = (typeof PERMISSION_ROLES)[number];

export const DEFAULT_VIEWER_PERMISSIONS: Record<MemberPermissionKey, boolean> = {
  add_members: true,
  create_invites: true,
  create_polls: true,
  edit_info: true,
  mention_everyone: true,
  pin_messages: true,
  send_media: true,
  send_messages: true,
};

export function conversationPermissionDefaults(): {
  member_permissions: Record<string, never>;
  permissions: Record<MemberPermissionKey, boolean>;
  restrict_forwarding: boolean;
  slow_mode_seconds: number;
} {
  return {
    member_permissions: {},
    permissions: { ...DEFAULT_VIEWER_PERMISSIONS },
    restrict_forwarding: false,
    slow_mode_seconds: 0,
  };
}

export function minRoleFor(
  document: { [key: string]: string } | undefined,
  key: MemberPermissionKey,
): PermissionRole {
  const value = document?.[key];
  return PERMISSION_ROLES.includes(value as PermissionRole) ? (value as PermissionRole) : "member";
}
