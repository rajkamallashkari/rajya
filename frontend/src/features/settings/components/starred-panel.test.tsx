import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { StarredPanel } from "./starred-panel";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

describe("StarredPanel", () => {
  it("falls back through saved timestamps when message time is absent", async () => {
    setAccessSession(testSession());
    server.use(
      http.get("*/api/v1/saved_messages", () =>
        HttpResponse.json({
          saved_messages: [
            {
              conversation_title: null,
              created_at: "2026-01-02T00:00:00.000Z",
              id: 1,
              message: {
                body: "Saved one",
                conversation_id: 1,
                created_at: null,
                id: 101,
                sender: null,
              },
              message_id: 101,
            },
            {
              conversation_title: null,
              created_at: null,
              id: 2,
              message: {
                body: "Saved two",
                conversation_id: 1,
                created_at: null,
                id: 102,
                sender: null,
              },
              message_id: 102,
            },
          ],
        }),
      ),
    );
    render(
      <AppProviders>
        <StarredPanel />
      </AppProviders>,
    );

    expect(await screen.findByText("Saved one")).toBeInTheDocument();
    expect(document.querySelectorAll("time")[0]).toHaveAttribute(
      "datetime",
      "2026-01-02T00:00:00.000Z",
    );
    expect(document.querySelectorAll("time")[1]).toHaveAttribute("datetime", "");
  });
});
