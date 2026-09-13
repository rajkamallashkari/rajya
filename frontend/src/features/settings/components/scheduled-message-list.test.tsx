import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { ScheduledMessageList } from "@/features/settings/components/scheduled-message-list";
import { en } from "@/shared/lib/i18n/catalog";
import type { components } from "@/shared/lib/api/schema";
import { server } from "@/test/msw";

type ScheduledMessage = components["schemas"]["ScheduledMessage"];

const rows: ScheduledMessage[] = ["Edit me", "Move me", "Send me", "Cancel me", "Close me"].map(
  (body, index) => ({
    body,
    conversation_id: 1,
    conversation: {
      id: 1,
      kind: "direct",
      member_count: 2,
      peer: { display_name: "Grace", id: 2, kind: "human", username: "grace" },
    },
    id: index + 1,
    occurrences_sent: 0,
    scheduled_at: "2099-01-01T12:00:00.000Z",
  }),
);

describe("ScheduledMessageList", () => {
  it("edits text, reschedules, sends, and cancels from row context menus", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const patches: Array<{ id: number; body: Record<string, unknown> }> = [];
    const sent: number[] = [];
    const cancelled: number[] = [];
    server.use(
      http.patch("*/api/v1/scheduled_messages/:id", async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        patches.push({ id: Number(params.id), body });
        return HttpResponse.json({ ...rows[Number(params.id) - 1], ...body });
      }),
      http.post("*/api/v1/scheduled_messages/:id/send_now", ({ params }) => {
        sent.push(Number(params.id));
        return HttpResponse.json(
          {
            body: "Send me",
            conversation_id: 1,
            created_at: "2026-01-01T12:00:00.000Z",
            deleted: false,
            id: 20,
            kind: "text",
            position: 20,
            revision: 0,
            silent: false,
          },
          { status: 201 },
        );
      }),
      http.delete("*/api/v1/scheduled_messages/:id", ({ params }) => {
        cancelled.push(Number(params.id));
        return HttpResponse.json({ ok: true });
      }),
    );
    render(
      <AppProviders>
        <ScheduledMessageList rows={rows} />
      </AppProviders>,
    );

    const editRow = screen.getByLabelText(
      en.settings.scheduled_actions.replace("{{message}}", "Edit me"),
    );
    editRow.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await user.click(screen.getByRole("menuitem", { name: en.settings.scheduled_edit }));
    const text = screen.getByLabelText(en.settings.scheduled_message_text);
    await user.clear(text);
    await user.type(text, "Updated text");
    await user.click(screen.getByRole("button", { name: en.settings.scheduled_save }));

    fireEvent.contextMenu(
      screen.getByLabelText(en.settings.scheduled_actions.replace("{{message}}", "Move me")),
    );
    await user.click(screen.getByRole("menuitem", { name: en.settings.scheduled_reschedule }));
    const date = screen.getByLabelText(en.settings.scheduled_send_at);
    await user.clear(date);
    await user.type(date, "2099-02-03T14:30");
    await user.click(screen.getByRole("button", { name: en.settings.scheduled_save }));

    fireEvent.contextMenu(
      screen.getByLabelText(en.settings.scheduled_actions.replace("{{message}}", "Send me")),
    );
    await user.click(screen.getByRole("menuitem", { name: en.settings.scheduled_send_now }));
    fireEvent.contextMenu(
      screen.getByLabelText(en.settings.scheduled_actions.replace("{{message}}", "Cancel me")),
    );
    await user.click(screen.getByRole("menuitem", { name: en.settings.scheduled_cancel }));

    fireEvent.contextMenu(
      screen.getByLabelText(en.settings.scheduled_actions.replace("{{message}}", "Close me")),
    );
    await user.click(screen.getByRole("menuitem", { name: en.settings.scheduled_edit }));
    await user.click(screen.getByText(en.settings.scheduled_close_editor, { selector: "button" }));

    await waitFor(() => {
      expect(patches).toEqual([
        { id: 1, body: { body: "Updated text" } },
        { id: 2, body: { scheduled_at: new Date("2099-02-03T14:30").toISOString() } },
      ]);
      expect(sent).toEqual([3]);
      expect(cancelled).toEqual([4]);
    });
  });
});
