import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LayerHost } from "./layer-host";
import { AppProviders } from "@/app/providers";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import {
  DESKTOP_CHAT_COLUMNS,
  LAYER_DEFAULT_COLUMN_WIDTH_PX,
  LAYER_MIN_WIDTH_PX,
  LAYER_OVERLAY_WIDTH_PX,
  LAYER_RESIZE_HANDLE_PX,
} from "@/shared/lib/navigation/constants";
import { Button } from "@/shared/ui/button";

const layersCss = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../../styles/layers.css"),
  "utf8",
);

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

const settings = {
  conversationId: "settings",
  id: "settings",
  kind: "settings" as const,
  title: "Settings",
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
      empty={<p data-chats-welcome="">{"welcome"}</p>}
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
  it("restores pointer events on mobile layer frames", () => {
    expect(layersCss).toMatch(/\.layer-frame-mobile\s*\{[^}]*pointer-events:\s*auto;/);
  });

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

  it("resizes the list without shrinking the overlay", () => {
    setDesktopViewport(1280);
    useLayerStore.getState().pushLayer(conversation);
    render(
      <AppProviders>
        <LayerHost
          base={<p>{"list"}</p>}
          empty={<p>{"welcome"}</p>}
          renderLayer={(layer) => <p>{layer.title}</p>}
        />
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
    const overlay = document.querySelector("[data-layer-column='overlay']") as HTMLElement;
    expect(overlay).toHaveAttribute("data-column-width", String(LAYER_OVERLAY_WIDTH_PX));
    expect(list).toHaveAttribute("data-column-width", "360");
    mockRect(list, 360);
    fireEvent.pointerDown(handle, { pointerId: 9, clientX: 200 });
    fireEvent.pointerMove(handle, { pointerId: 9, clientX: 280 });
    expect(list).toHaveAttribute("data-column-width", "440");
    expect(overlay).toHaveAttribute("data-column-width", String(LAYER_OVERLAY_WIDTH_PX));
  });

  it("keeps two desktop columns and overlays details over the chat", () => {
    setDesktopViewport(1280);
    render(
      <AppProviders>
        <LayerHost
          base={<p>{"list"}</p>}
          empty={<p data-chats-welcome="">{"welcome"}</p>}
          renderLayer={(layer) => <p>{layer.title}</p>}
        />
      </AppProviders>,
    );
    expect(document.querySelector("[data-layer-host]")).toHaveAttribute(
      "data-desktop-columns",
      String(DESKTOP_CHAT_COLUMNS),
    );
    expect(document.querySelector("[data-chats-welcome]")).toBeInTheDocument();
    act(() => {
      useLayerStore.getState().pushLayer(settings);
    });
    expect(document.querySelector("[data-chats-welcome]")).toBeInTheDocument();
    expect(document.querySelector("[data-layer='settings']")).not.toBeNull();
    expect(document.querySelector("[data-layer-column='overlay']")).toBeInTheDocument();
    expect(document.querySelector("[data-layer-column='chat']")).toBeInTheDocument();
    act(() => {
      useLayerStore.getState().popLayer();
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
      String(DESKTOP_CHAT_COLUMNS),
    );
    expect(document.querySelectorAll("[data-layer='conversation']")).toHaveLength(1);
    expect(document.querySelectorAll("[data-layer='profile']")).toHaveLength(2);
    expect(document.querySelector("[data-layer-column='overlay']")).toBeInTheDocument();
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
    expect(document.querySelector("[data-layer-column='overlay']")).toBeNull();
    expect(document.querySelector("[data-layer-host]")).toHaveAttribute(
      "data-desktop-columns",
      String(DESKTOP_CHAT_COLUMNS),
    );
  });

  it("fits the list when the host is narrower than the default list", () => {
    setDesktopViewport(641);
    useLayerStore.getState().openConversation(conversation);
    render(
      <AppProviders>
        <LayerHost base={<p>{"list"}</p>} renderLayer={(layer) => <p>{layer.title}</p>} />
      </AppProviders>,
    );
    expect(document.querySelector("[data-layer='base']")).toHaveAttribute(
      "data-column-width",
      String(641 - LAYER_RESIZE_HANDLE_PX - LAYER_MIN_WIDTH_PX),
    );
  });
});
