import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GroupPermissions } from "./group-permissions";
import { AppProviders } from "@/app/providers";
import { conversationPermissionDefaults } from "@/features/conversations/model/permissions";
import type { Conversation } from "@/features/conversations/api/http";
import { en } from "@/shared/lib/i18n/catalog";
import { findConversation } from "@/shared/lib/api/msw/messaging-store";

const conversation: Conversation = {
  id: 2,
  kind: "group",
  title: "Team",
  last_activity_at: "2026-01-01T12:00:00.000Z",
  unread_count: 0,
  members: [],
  role: "owner",
  ...conversationPermissionDefaults(),
};

describe("GroupPermissions", () => {
  it("narrows send_messages, sets slow mode, and restricts forwarding", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <GroupPermissions conversation={conversation} />
      </AppProviders>,
    );
    expect(screen.getByText(en.conversations.permissions.title)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: en.conversations.permissions.admin })[0]!);
    await waitFor(() => {
      expect(findConversation(2)?.member_permissions).toEqual({ add_members: "admin" });
    });
    await user.click(screen.getByRole("button", { name: en.conversations.slow_mode.seconds.replace("{{count}}", "10") }));
    await waitFor(() => {
      expect(findConversation(2)?.slow_mode_seconds).toBe(10);
    });
    await user.click(screen.getByRole("switch", { name: en.conversations.restrict_forwarding }));
    await waitFor(() => {
      expect(findConversation(2)?.restrict_forwarding).toBe(true);
    });
  });
});
