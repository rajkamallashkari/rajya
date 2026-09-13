import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { AVATAR_MAX_BYTES } from "@/features/auth/model/limits";
import type { Bot, BotRequest } from "@/features/bots/api/http";
import { en } from "@/shared/lib/i18n/catalog";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";
import { BotBuilderForm } from "./bot-builder-form";

const payload = {
  bio: "A useful assistant",
  name: "Cedar",
  persona_prompt: "A".repeat(80),
  username: "cedar_bot",
};

const request = {
  avatar_url: "https://media.test/avatar.webp",
  created_at: "2026-01-01T00:00:00.000Z",
  id: 2,
  kind: "edit",
  payload,
  requester_account_id: 1,
  status: "pending",
  target_bot_id: 1,
} as BotRequest;

const bot = {
  account: {
    avatar_url: "https://media.test/bot.webp",
    bio: payload.bio,
    display_name: payload.name,
    id: 99,
    kind: "bot",
    shared_memory: true,
    username: payload.username,
  },
  id: 1,
  memory_enabled: true,
  owner_account_id: 1,
  persona_prompt: payload.persona_prompt,
} as Bot;

function renderForm(props: React.ComponentProps<typeof BotBuilderForm> = {}) {
  setAccessSession(testSession());
  return render(
    <AppProviders>
      <BotBuilderForm {...props} />
    </AppProviders>,
  );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole("textbox", { name: en.bots.name }), payload.name);
  await user.type(screen.getByRole("textbox", { name: en.bots.username }), payload.username);
  await user.type(screen.getByRole("textbox", { name: en.bots.bio }), payload.bio);
  await user.type(
    screen.getByRole("textbox", { name: en.bots.persona_prompt }),
    payload.persona_prompt,
  );
}

describe("BotBuilderForm", () => {
  it("validates avatar files, removes a draft avatar, and saves", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCancel = vi.fn();
    const onSaved = vi.fn();
    const view = renderForm({ draft: request, onCancel, onSaved });
    const input = view.container.querySelector('input[type="file"]')!;
    const inputClick = vi.spyOn(input as HTMLInputElement, "click");

    await user.click(screen.getByRole("button", { name: en.bots.avatar_change }));
    expect(inputClick).toHaveBeenCalled();
    fireEvent.change(input, { target: { files: [] } });
    fireEvent.change(input, {
      target: { files: [new File(["avatar"], "avatar.txt", { type: "text/plain" })] },
    });
    expect(screen.getByText(en.bots.avatar_file_invalid)).toBeInTheDocument();
    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "avatar.webp", {
            type: "image/webp",
          }),
        ],
      },
    });
    expect(screen.getByText(en.bots.avatar_size_invalid)).toBeInTheDocument();
    fireEvent.change(input, {
      target: { files: [new File(["avatar"], "avatar.webp", { type: "image/webp" })] },
    });
    await user.click(screen.getByRole("button", { name: en.bots.avatar_remove }));
    await user.click(screen.getByRole("button", { name: en.bots.builder_submit }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(screen.getByRole("textbox", { name: en.bots.name })).toHaveValue("");
    await user.click(screen.getByRole("button", { name: en.bots.cancel }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("updates an existing request after removing its avatar", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm({ request, onSaved });
    await user.click(screen.getByRole("button", { name: en.bots.avatar_remove }));
    await user.click(screen.getByRole("button", { name: en.bots.update_request }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it("submits an edit proposal for an owned bot", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm({ bot, onSaved });
    expect(screen.getByText(en.bots.edit)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.bots.builder_submit }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });

  it("reports save and avatar upload failures", async () => {
    const user = userEvent.setup();
    server.use(http.post("*/api/v1/bot_requests", () => HttpResponse.json({}, { status: 500 })));
    const first = renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: en.bots.builder_submit }));
    expect(await screen.findByText(en.bots.save_failed)).toBeInTheDocument();
    first.unmount();

    server.use(http.post("*/api/v1/direct_uploads", () => HttpResponse.json({}, { status: 500 })));
    const second = renderForm();
    await fillRequiredFields(user);
    fireEvent.change(second.container.querySelector('input[type="file"]')!, {
      target: { files: [new File(["avatar"], "avatar.webp", { type: "image/webp" })] },
    });
    await user.click(screen.getByRole("button", { name: en.bots.builder_submit }));
    expect(await screen.findByText(en.bots.avatar_upload_failed)).toBeInTheDocument();
  });
});
