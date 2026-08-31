import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { BotDirectorySheet } from "./bot-directory-sheet";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { en } from "@/shared/lib/i18n/catalog";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

describe("BotDirectorySheet", () => {
  it("lists bots, starts a DM, and submits a proposal", async () => {
    setAccessSession(testSession());
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <BotDirectorySheet onOpenChange={() => undefined} open />
      </AppProviders>,
    );
    expect(await screen.findByText("Nimbus")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.bots.open.replace("{{name}}", "Nimbus") }));
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    });
    await user.type(screen.getByRole("textbox", { name: en.bots.name }), "Cedar");
    await user.type(screen.getByRole("textbox", { name: en.bots.username }), "cedar_bot");
    await user.type(screen.getByRole("textbox", { name: en.bots.bio }), "A calm helper");
    await user.type(screen.getByRole("textbox", { name: en.bots.persona_prompt }), "A".repeat(80));
    await user.click(screen.getByRole("button", { name: en.bots.builder_submit }));
    expect(await screen.findByText(en.bots.proposed)).toBeInTheDocument();
    await user.click(screen.getByRole("switch"));
    await user.click(await screen.findByRole("button", { name: en.ai.build_style }));
    expect(await screen.findByText("Casual, short sentences.")).toBeInTheDocument();
  });

  it("shows empty, blocks a short persona, and never builds while consent is off", async () => {
    setAccessSession(testSession());
    server.use(http.get("*/api/v1/bots", () => HttpResponse.json({ bots: [] })));
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <BotDirectorySheet onOpenChange={() => undefined} open />
      </AppProviders>,
    );
    expect(await screen.findByText(en.bots.empty)).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: en.bots.persona_prompt }), "short");
    expect(screen.getByText(en.bots.prompt_too_short.replace("{{count}}", "80"))).toBeInTheDocument();
    fireEvent.submit(document.querySelector("[data-bot-builder]")!);
    expect(screen.queryByText(en.bots.proposed)).toBeNull();
    expect(screen.queryByRole("button", { name: en.ai.build_style })).toBeNull();
    await user.click(screen.getByRole("switch"));
    expect(await screen.findByRole("button", { name: en.ai.build_style })).toBeInTheDocument();
    server.use(
      http.post("*/api/v1/style_profile", () =>
        HttpResponse.json({ error: { code: "validation_failed", message: "validation_failed", details: {} } }, { status: 422 }),
      ),
    );
    await user.click(screen.getByRole("button", { name: en.ai.build_style }));
    expect(await screen.findByText(en.ai.style_failed)).toBeInTheDocument();
  });
});
