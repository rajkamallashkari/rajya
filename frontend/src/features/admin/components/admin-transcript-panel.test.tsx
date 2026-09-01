import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/messages/model/highlight", () => ({
  highlightCode: vi.fn().mockResolvedValue(null),
}));

import { AppProviders } from "@/app/providers";
import { AdminTranscriptPanel } from "./admin-transcript-panel";
import { setAccessSession } from "@/features/auth/model/access-session";
import { en } from "@/shared/lib/i18n/catalog";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

describe("AdminTranscriptPanel", () => {
  it("renders script tags as text and does not create a script node", async () => {
    setAccessSession(testSession());
    server.use(
      http.get("*/api/v1/admin/conversations/:conversation_id/messages", () =>
        HttpResponse.json({
          messages: [
            {
              id: 1,
              conversation_id: 1,
              position: 1,
              revision: 1,
              kind: "text",
              body: "<script>alert(1)</script>",
              deleted: false,
              silent: false,
            },
            {
              id: 2,
              conversation_id: 1,
              position: 2,
              revision: 1,
              kind: "text",
              body: null,
              deleted: false,
              silent: false,
            },
          ],
          meta: { has_more_before: false, has_more_after: false },
        }),
      ),
    );
    const router = createMemoryRouter(
      [{ path: "/admin/conversations/:conversationId", element: <AdminTranscriptPanel /> }],
      { initialEntries: ["/admin/conversations/1"] },
    );
    const { container } = render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    expect(await screen.findByText("<script>alert(1)</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(en.admin.transcript)).toBeInTheDocument();
  });
});
