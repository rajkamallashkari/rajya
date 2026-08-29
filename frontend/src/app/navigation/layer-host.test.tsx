import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LayerHost } from "./layer-host";
import { AppProviders } from "@/app/providers";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { LAYER_MIN_WIDTH_PX, MOBILE_MAX_PX } from "@/shared/lib/navigation/constants";
import { Button } from "@/shared/ui/button";

const conversation = {
  conversationId: "ada",
  id: "conversation:ada",
  kind: "conversation" as const,
  title: "Ada Lovelace",
};

const profile = {
  conversationId: "ada",
  id: "profile:ada",
  kind: "profile" as const,
  title: "Ada Lovelace",
};

function Demo() {
  const pushLayer = useLayerStore((state) => state.pushLayer);
  return (
    <LayerHost
      base={
        <Button onClick={() => pushLayer(conversation)} type="button">
          {"open"}
        </Button>
      }
      renderLayer={(layer) => <div data-layer-body={layer.kind}>{layer.title}</div>}
    />
  );
}

describe("LayerHost", () => {
  it("keeps buried mobile layers mounted and inert", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 390 });
    const user = userEvent.setup();
    render(
      <AppProviders>
        <Demo />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: "open" }));
    useLayerStore.getState().pushLayer(profile);
    await waitFor(() => {
      expect(document.querySelector("[data-layer='profile']")).not.toBeNull();
    });
    expect(document.querySelector("[data-layer-host]")).toHaveAttribute(
      "data-presentation",
      "mobile",
    );
    expect(document.querySelector("[data-layer='base']")).toHaveAttribute("inert");
    expect(document.querySelector("[data-layer='conversation']")).toHaveAttribute("inert");
    expect(document.querySelector("[data-layer='profile']")).not.toHaveAttribute("inert");
    expect(document.querySelector("[data-layer-host]")).toHaveAttribute("data-stack-depth", "2");
  });

  it("resizes a desktop panel so the split follows the pointer", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: MOBILE_MAX_PX + 200,
    });
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    })) as typeof window.matchMedia;
    useLayerStore.getState().pushLayer(conversation);
    render(
      <AppProviders>
        <LayerHost base={<p>{"list"}</p>} renderLayer={(layer) => <p>{layer.title}</p>} />
      </AppProviders>,
    );
    const handle = document.querySelector("[data-resize-delta]") as HTMLButtonElement;
    const panel = handle.nextElementSibling as HTMLElement;
    expect(handle).toBeInTheDocument();
    vi.spyOn(handle, "hasPointerCapture").mockImplementation((id) => id === 9);
    Object.defineProperty(handle, "nextElementSibling", { configurable: true, value: null });
    fireEvent.pointerDown(handle, { pointerId: 9, clientX: 200 });
    expect(handle.dataset.originWidth).toBe(String(LAYER_MIN_WIDTH_PX));
    Object.defineProperty(handle, "nextElementSibling", { configurable: true, value: panel });
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      toJSON: () => ({}),
      top: 0,
      width: 0,
      x: 0,
      y: 0,
    });
    fireEvent.pointerDown(handle, { pointerId: 9, clientX: 200 });
    expect(handle.dataset.originWidth).toBe(String(LAYER_MIN_WIDTH_PX));
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 400,
      right: 800,
      toJSON: () => ({}),
      top: 0,
      width: 400,
      x: 400,
      y: 0,
    });
    fireEvent.pointerDown(handle, { pointerId: 9, clientX: 200 });
    fireEvent.pointerMove(handle, { pointerId: 9, clientX: 240 });
    expect(panel.style.flex).toBe("0 0 360px");
    fireEvent.pointerMove(handle, { pointerId: 9, clientX: 160 });
    expect(panel.style.flex).toBe("0 0 440px");
    delete handle.dataset.originX;
    fireEvent.pointerMove(handle, { pointerId: 9, clientX: 180 });
    expect(panel.style.flex).toBe("0 0 400px");
    delete handle.dataset.originWidth;
    fireEvent.pointerMove(handle, { pointerId: 9, clientX: 180 });
    expect(panel.style.flex).toBe(`0 0 ${String(LAYER_MIN_WIDTH_PX)}px`);
    fireEvent.pointerMove(handle, { pointerId: 8, clientX: 200 });
    expect(Number(handle.dataset.resizeDelta)).toBe(LAYER_MIN_WIDTH_PX);
  });
});
