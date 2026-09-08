import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ComposeMenu } from "./compose-menu";
import { AppProviders } from "@/app/providers";
import { useComposeStore } from "@/features/conversations/store/compose-store";
import { en } from "@/shared/lib/i18n/catalog";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

describe("ComposeMenu", () => {
  it("opens New message and New group, and keeps channel and broadcast disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <ComposeMenu />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.compose.new_conversation }));
    expect(await screen.findByRole("menuitem", { name: en.compose.message })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: en.compose.group })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: `${en.compose.channel} ${en.compose.soon}` }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("menuitem", { name: `${en.compose.broadcast} ${en.compose.soon}` }),
    ).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("menuitem", { name: en.compose.message }));
    expect(useLayerStore.getState().layers[0]?.kind).toBe("compose_message");
    useComposeStore.getState().setMenuOpen(true);
    await user.click(await screen.findByRole("menuitem", { name: en.compose.group }));
    expect(useLayerStore.getState().layers.map((layer) => layer.kind)).toEqual(["compose_group"]);
  });
});
