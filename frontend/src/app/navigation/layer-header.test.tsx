import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LayerHeader } from "./layer-header";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

describe("LayerHeader", () => {
  it("pops on back and renders a plain title", async () => {
    const user = userEvent.setup();
    useLayerStore.getState().pushLayer({
      conversationId: "ada",
      id: "conversation:ada",
      kind: "conversation",
      title: "Ada",
    });
    render(
      <AppProviders>
        <LayerHeader title="Ada" />
      </AppProviders>,
    );
    expect(screen.getByText("Ada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });
});
