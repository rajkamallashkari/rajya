import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import * as apiClient from "@/shared/lib/api/client";
import { server } from "@/test/msw";
import { classifySendError, OutboxSendError, sendErrorFromResult, sendOutboxMessage } from "./send";

describe("outbox send", () => {
  it("classifies HTTP failures and sends through the OpenAPI client", async () => {
    expect(sendErrorFromResult({ error: { code: "unauthenticated" } }).reason).toBe("auth");
    expect(sendErrorFromResult({ error: { error: { code: "rate_limited" } } }).reason).toBe(
      "network",
    );
    expect(sendErrorFromResult({ response: new Response(null, { status: 401 }) }).reason).toBe(
      "auth",
    );
    expect(sendErrorFromResult({ response: new Response(null, { status: 429 }) }).reason).toBe(
      "network",
    );
    expect(sendErrorFromResult({ response: new Response(null, { status: 500 }) }).reason).toBe(
      "network",
    );
    expect(sendErrorFromResult({ response: new Response(null, { status: 422 }) }).reason).toBe(
      "rejected",
    );
    expect(sendErrorFromResult({ error: { code: "fail" }, response: new Response(null, { status: 403 }) }).reason).toBe(
      "rejected",
    );
    expect(classifySendError(new OutboxSendError("rejected"))).toBe("rejected");
    expect(classifySendError(new Error("nope"))).toBe("network");
    expect(errorCodeCoverage()).toBeUndefined();

    server.use(
      http.post("*/api/v1/messages", () =>
        HttpResponse.json({ id: 1, conversation_id: 1, position: 1, revision: 1, kind: "text", body: "ok", deleted: false, silent: false, created_at: "t" }, { status: 201 }),
      ),
    );
    const sent = await sendOutboxMessage({
      body: "ok",
      clientNonce: "11111111-1111-1111-1111-111111111111",
      conversationId: 1,
      origin: window.location.origin,
      token: "tok",
    });
    expect(sent.body).toBe("ok");

    const originalOnline = navigator.onLine;
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    await expect(
      sendOutboxMessage({
        body: "offline",
        clientNonce: "11111111-1111-1111-1111-111111111115",
        conversationId: 1,
        origin: window.location.origin,
        token: "tok",
      }),
    ).rejects.toMatchObject({ reason: "network" });
    Object.defineProperty(navigator, "onLine", { configurable: true, value: originalOnline });

    server.use(http.post("*/api/v1/messages", () => HttpResponse.json({ error: { code: "fail" } }, { status: 422 })));
    await expect(
      sendOutboxMessage({
        body: "no",
        clientNonce: "11111111-1111-1111-1111-111111111112",
        conversationId: 1,
        origin: window.location.origin,
        token: "tok",
      }),
    ).rejects.toBeInstanceOf(OutboxSendError);

    server.use(
      http.post("*/api/v1/messages", () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(
      sendOutboxMessage({
        body: "down",
        clientNonce: "11111111-1111-1111-1111-111111111113",
        conversationId: 1,
        origin: window.location.origin,
        replyToMessageId: 2,
        silent: true,
        token: "tok",
      }),
    ).rejects.toMatchObject({ reason: "network" });

    vi.spyOn(apiClient, "createApiClient").mockReturnValue({
      POST: async () => {
        throw new Error("boom");
      },
    } as unknown as ReturnType<typeof apiClient.createApiClient>);
    await expect(
      sendOutboxMessage({
        body: "throw",
        clientNonce: "11111111-1111-1111-1111-111111111114",
        conversationId: 1,
        origin: window.location.origin,
        token: "tok",
      }),
    ).rejects.toMatchObject({ reason: "network" });
    vi.restoreAllMocks();
  });
});

function errorCodeCoverage(): string | undefined {
  return sendErrorFromResult({ error: "x" }).reason === "network" ? undefined : "hit";
}
