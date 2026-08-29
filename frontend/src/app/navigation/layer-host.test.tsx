import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LayerHost } from "./layer-host";
import { AppProviders } from "@/app/providers";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import {
  LAYER_DEFAULT_COLUMN_WIDTH_PX,
  LAYER_MIN_WIDTH_PX,
} from "@/shared/lib/navigation/constants";
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

function setDesktopViewport(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
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
}

function mockRect(node: Element, width: number): void {
  vi.spyOn(node, "getBoundingClientRect").mockReturnValue({
    bottom: 800,
    height: 800,
    left: 0,
    right: width,
    toJSON: () => ({}),
    top: 0,
    width,
    x: 0,
    y: 0,
  });
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

  it("resizes the list without pinning the conversation or the detail column", () => {
    setDesktopViewport(1280);
    useLayerStore.getState().pushLayer(conversation);
    render(
      <AppProviders>
        <LayerHost base={<p>{"list"}</p>} renderLayer={(layer) => <p>{layer.title}</p>} />
      </AppProviders>,
    );
    const handle = document.querySelector("[data-resize-edge='list']") as HTMLButtonElement;
    const list = document.querySelector("[data-layer='base']") as HTMLElement;
    const host = document.querySelector("[data-layer-host]") as HTMLElement;
    expect(handle).toBeInTheDocument();
    expect(list).toHaveAttribute("data-column-width", String(LAYER_DEFAULT_COLUMN_WIDTH_PX));
    vi.spyOn(handle, "hasPointerCapture").mockImplementation((id) => id === 9);
    fireEvent.pointerDown(handle, { pointerId: 9, clientX: 200 });
    fireEvent.pointerMove(handle, { pointerId: 9, clientX: 240 });
    expect(list).toHaveAttribute("data-column-width", String(LAYER_DEFAULT_COLUMN_WIDTH_PX + 40));
    expect(document.querySelector("[data-layer='conversation']")).not.toHaveStyle({
      flex: "0 0 400px",
    });
    mockRect(list, 400);
    mockRect(host, 1280);
    fireEvent.pointerDown(handle, { pointerId: 9, clientX: 200 });
    fireEvent.pointerMove(handle, { pointerId: 9, clientX: 160 });
    expect(list).toHaveAttribute("data-column-width", "360");
    fireEvent.pointerMove(handle, { pointerId: 8, clientX: 200 });
    expect(Number(handle.dataset.resizeDelta)).toBe(360);
    act(() => {
      useLayerStore.getState().pushLayer(profile);
    });
    const detail = document.querySelector("[data-layer-column='detail']") as HTMLElement;
    const detailHandle = document.querySelector("[data-resize-edge='detail']") as HTMLButtonElement;
    expect(detail).toHaveAttribute("data-column-width", String(LAYER_DEFAULT_COLUMN_WIDTH_PX));
    expect(list).toHaveAttribute("data-column-width", "360");
    vi.spyOn(detailHandle, "hasPointerCapture").mockImplementation((id) => id === 7);
    mockRect(list, 360);
    mockRect(detail, 360);
    fireEvent.pointerDown(handle, { pointerId: 9, clientX: 200 });
    fireEvent.pointerMove(handle, { pointerId: 9, clientX: 280 });
    expect(list).toHaveAttribute("data-column-width", "440");
    expect(detail).toHaveAttribute("data-column-width", String(LAYER_DEFAULT_COLUMN_WIDTH_PX));
    fireEvent.pointerDown(detailHandle, { pointerId: 7, clientX: 900 });
    fireEvent.pointerMove(detailHandle, { pointerId: 7, clientX: 860 });
    expect(detail).toHaveAttribute("data-column-width", "400");
    expect(list).toHaveAttribute("data-column-width", "440");
    fireEvent.pointerMove(detailHandle, { pointerId: 7, clientX: 2000 });
    expect(detail).toHaveAttribute("data-column-width", String(LAYER_MIN_WIDTH_PX));
  });

  it("keeps desktop to three columns and stacks details in the third pane", () => {
    setDesktopViewport(1280);
    render(
      <AppProviders>
        <LayerHost base={<p>{"list"}</p>} renderLayer={(layer) => <p>{layer.title}</p>} />
      </AppProviders>,
    );
    expect(document.querySelector("[data-layer-host]")).toHaveAttribute(
      "data-desktop-columns",
      "1",
    );
    act(() => {
      useLayerStore.getState().openConversation(conversation);
      useLayerStore.getState().pushLayer(profile);
      useLayerStore.getState().pushLayer({
        conversationId: "ada",
        id: "profile:member",
        kind: "profile",
        title: "Member",
      });
    });
    expect(document.querySelector("[data-layer-host]")).toHaveAttribute(
      "data-desktop-columns",
      "3",
    );
    expect(document.querySelectorAll("[data-layer='conversation']")).toHaveLength(1);
    expect(document.querySelectorAll("[data-layer='profile']")).toHaveLength(2);
    expect(document.querySelector("[data-layer-column='detail']")).toBeInTheDocument();
    expect(document.querySelector("[data-layer='base']")).not.toHaveAttribute("inert");
    expect(document.querySelector("[data-layer='conversation']")).not.toHaveAttribute("inert");
    expect(document.querySelector("[data-layer-id='profile:ada']")).toHaveAttribute("inert");
    expect(document.querySelector("[data-layer-id='profile:member']")).not.toHaveAttribute("inert");
    expect(document.querySelector("[data-layer='base']")).toHaveAttribute(
      "data-column-width",
      String(LAYER_DEFAULT_COLUMN_WIDTH_PX),
    );
    act(() => {
      useLayerStore.getState().openConversation({
        conversationId: "team",
        id: "conversation:team",
        kind: "conversation",
        title: "Team",
      });
    });
    expect(document.querySelectorAll("[data-layer='conversation']")).toHaveLength(1);
    expect(document.querySelector("[data-layer-column='detail']")).toBeNull();
    expect(document.querySelector("[data-layer-host]")).toHaveAttribute(
      "data-desktop-columns",
      "2",
    );
  });

  it("fits default column widths when the host cannot keep both defaults", () => {
    setDesktopViewport(900);
    useLayerStore.getState().openConversation(conversation);
    useLayerStore.getState().pushLayer(profile);
    render(
      <AppProviders>
        <LayerHost base={<p>{"list"}</p>} renderLayer={(layer) => <p>{layer.title}</p>} />
      </AppProviders>,
    );
    expect(document.querySelector("[data-layer='base']")).toHaveAttribute(
      "data-column-width",
      "332",
    );
    expect(document.querySelector("[data-layer-column='detail']")).toHaveAttribute(
      "data-column-width",
      String(LAYER_MIN_WIDTH_PX),
    );
  });
});
