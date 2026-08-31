import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LayerHeader } from "./layer-header";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

describe("LayerHeader", () => {
  it("pops on back and can hide the back control", async () => {
    const user = userEvent.setup();
    useLayerStore.getState().pushLayer({
      conversationId: "ada",
      id: "conversation:ada",
      kind: "conversation",
      title: "Ada",
    });
    const { unmount } = render(
      <AppProviders>
        <LayerHeader title="Ada" />
      </AppProviders>,
    );
    expect(screen.getByText("Ada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
    unmount();
    const onBack = vi.fn();
    const second = render(
      <AppProviders>
        <LayerHeader onBack={onBack} title="Ada" />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    expect(onBack).toHaveBeenCalled();
    second.unmount();
    render(
      <AppProviders>
        <LayerHeader showBack={false} title="Ada" />
      </AppProviders>,
    );
    expect(screen.queryByRole("button", { name: en.shell.back })).not.toBeInTheDocument();
  });
});
