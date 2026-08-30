import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageInfoSheet } from "./message-info-sheet";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";
import { VIEWER } from "@/shared/lib/api/msw/messaging-store";

describe("MessageInfoSheet", () => {
  it("shows empty and receipt lists", () => {
    const { rerender } = render(
      <AppProviders>
        <MessageInfoSheet info={{ delivered: [], read: [] }} onOpenChange={() => undefined} open />
      </AppProviders>,
    );
    expect(screen.getByText(en.messages.info.empty)).toBeInTheDocument();
    rerender(
      <AppProviders>
        <MessageInfoSheet
          info={{
            delivered: [{ account: VIEWER, at: "2026-01-01T12:00:00.000Z" }],
            read: [{ account: { ...VIEWER, id: 2, display_name: "Peer" } }],
          }}
          onOpenChange={() => undefined}
          open
        />
      </AppProviders>,
    );
    expect(screen.getByText(en.messages.info.delivered)).toBeInTheDocument();
    expect(screen.getByText(en.messages.info.read)).toBeInTheDocument();
    expect(screen.getByText("Peer")).toBeInTheDocument();
  });
});
