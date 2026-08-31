import { describe, expect, it, vi } from "vitest";
import {
  handleNotificationClick,
  handlePush,
  parsePushData,
  type NotificationClickEventLike,
  type PushClients,
  type PushEventLike,
} from "./push-event";

describe("push events", () => {
  it("parses JSON payloads and treats invalid or missing data as empty", () => {
    expect(parsePushData({ data: { json: () => ({ title: "Hi" }) }, waitUntil: vi.fn() })).toEqual({
      title: "Hi",
    });
    expect(
      parsePushData({
        data: {
          json: () => {
            throw new Error("bad");
          },
        },
        waitUntil: vi.fn(),
      }),
    ).toEqual({});
    expect(parsePushData({ data: null, waitUntil: vi.fn() })).toEqual({});
  });

  it("shows a notification from the payload", async () => {
    const showNotification = vi.fn().mockResolvedValue(undefined);
    const event: PushEventLike = {
      data: { json: () => ({ title: "Ada", body: "Hi", tag: "c-1", url: "/c/1" }) },
      waitUntil: vi.fn(),
    };
    await handlePush(event, { registration: { showNotification } });
    expect(showNotification).toHaveBeenCalledWith("Ada", {
      body: "Hi",
      data: { title: "Ada", body: "Hi", tag: "c-1", url: "/c/1" },
      tag: "c-1",
    });
  });

  it("shows an empty title when the payload has none", async () => {
    const showNotification = vi.fn().mockResolvedValue(undefined);
    await handlePush(
      { data: { json: () => ({}) }, waitUntil: vi.fn() },
      { registration: { showNotification } },
    );
    expect(showNotification).toHaveBeenCalledWith("", expect.objectContaining({ body: undefined }));
  });

  it("focuses an existing client and navigates to the payload url", async () => {
    const focus = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn().mockResolvedValue(undefined);
    const openWindow = vi.fn();
    const event: NotificationClickEventLike = {
      notification: { data: { url: "/c/9?account=2" }, close: vi.fn() },
      waitUntil: vi.fn(),
    };
    const clients: PushClients = {
      matchAll: async () => [{ url: "/c/9?account=2", navigate, focus }],
      openWindow,
    };
    await handleNotificationClick(event, clients);
    expect(event.notification.close).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/c/9?account=2");
    expect(focus).toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
  });

  it("focuses a focused client without navigate and opens a window otherwise", async () => {
    const focus = vi.fn().mockResolvedValue(undefined);
    const openWindow = vi.fn().mockResolvedValue(null);
    await handleNotificationClick(
      { notification: { data: {}, close: vi.fn() }, waitUntil: vi.fn() },
      { matchAll: async () => [{ focused: true, focus }], openWindow },
    );
    expect(focus).toHaveBeenCalled();
    await handleNotificationClick(
      { notification: { close: vi.fn() }, waitUntil: vi.fn() },
      { matchAll: async () => [], openWindow },
    );
    expect(openWindow).toHaveBeenCalledWith("/");
  });
});
