import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MessageInfoSheet } from "./message-info-sheet";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";
import { VIEWER } from "@/shared/lib/api/msw/messaging-store";
import { resetLayerStore, useLayerStore } from "@/shared/lib/navigation/layer-store";

afterEach(resetLayerStore);

describe("MessageInfoSheet", () => {
  it("shows the empty state", () => {
    render(
      <AppProviders>
        <MessageInfoSheet
          conversationKind="direct"
          info={{ delivered: [], read: [] }}
          onOpenChange={() => undefined}
          open
        />
      </AppProviders>,
    );
    expect(screen.getByText(en.messages.info.empty)).toBeInTheDocument();
  });

  it("shows direct ticks with times but no peer identity", () => {
    const { rerender } = render(
      <AppProviders>
        <MessageInfoSheet
          conversationKind="direct"
          info={{
            delivered: [{ account: VIEWER, at: "2026-01-01T12:00:00.000Z" }],
            read: [
              {
                account: { ...VIEWER, display_name: "Peer", id: 2, username: "peer" },
                at: "2026-01-01T12:05:00.000Z",
              },
            ],
          }}
          onOpenChange={() => undefined}
          open
        />
      </AppProviders>,
    );
    expect(screen.getByText(en.messages.info.delivered)).toBeInTheDocument();
    expect(screen.getByText(en.messages.info.read)).toBeInTheDocument();
    expect(document.querySelector("[data-tick='delivered']")).not.toBeNull();
    expect(document.querySelector("[data-tick='read']")).not.toBeNull();
    expect(screen.getAllByRole("time")).toHaveLength(2);
    expect(screen.queryByText("Peer")).toBeNull();
    expect(screen.queryByText("@peer")).toBeNull();

    rerender(
      <AppProviders>
        <MessageInfoSheet
          conversationKind="direct"
          info={{ delivered: [{ account: VIEWER }], read: [] }}
          onOpenChange={() => undefined}
          open
        />
      </AppProviders>,
    );
    expect(screen.queryByRole("time")).toBeNull();
  });

  it("opens group account profiles only from the identity action", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AppProviders>
        <MessageInfoSheet
          conversationKind="group"
          info={{
            delivered: [
              {
                account: { ...VIEWER, display_name: "Peer", id: 2, username: "peer" },
                at: "2026-01-01T12:00:00.000Z",
              },
            ],
            read: [],
          }}
          onOpenChange={() => undefined}
          open
        />
      </AppProviders>,
    );

    expect(screen.getByText("@peer")).toBeInTheDocument();
    await user.click(screen.getByRole("time"));
    expect(useLayerStore.getState().layers).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: /Peer.*@peer/ }));
    expect(useLayerStore.getState().layers.at(-1)).toMatchObject({
      accountId: "2",
      id: "account:2",
      kind: "profile",
    });

    useLayerStore.getState().clearLayers();
    rerender(
      <AppProviders>
        <MessageInfoSheet
          conversationKind="group"
          info={{
            delivered: [{ account: { ...VIEWER, id: 3, username: "no_time" } }],
            read: [],
          }}
          onOpenChange={() => undefined}
          open
        />
      </AppProviders>,
    );
    expect(screen.queryByRole("time")).toBeNull();
  });
});
