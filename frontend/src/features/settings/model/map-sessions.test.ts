import { describe, expect, it } from "vitest";
import {
  canRevokeOtherSessions,
  exportableConversations,
  isOwnedStickerPack,
  mapDeviceSession,
  nicknameSearchHits,
  queryListStatus,
  shouldPollExportJobs,
} from "./map-sessions";
import type { components } from "@/shared/lib/api/schema";

const session = {
  id: 1,
  device_label: "Phone",
  user_agent: "Safari",
  ip: "1.1.1.1",
  last_seen_at: "2026-01-01T00:00:00Z",
  expires_at: "2026-02-01T00:00:00Z",
  current: true,
  revoked: false,
} satisfies components["schemas"]["DeviceSession"];

describe("settings mappers", () => {
  it("maps device sessions and export polling", () => {
    expect(mapDeviceSession({ ...session, device_label: null, ip: null, user_agent: null })).toMatchObject({
      deviceLabel: null,
      id: "1",
      ip: null,
      userAgent: null,
    });
    expect(canRevokeOtherSessions([session])).toBe(false);
    expect(
      canRevokeOtherSessions([session, { ...session, id: 2, current: false, revoked: false }]),
    ).toBe(true);
    expect(shouldPollExportJobs([{ status: "pending" } as never])).toBe(true);
    expect(shouldPollExportJobs([{ status: "processing" } as never])).toBe(true);
    expect(shouldPollExportJobs([{ status: "ready" } as never])).toBe(false);
    expect(isOwnedStickerPack({ owner_account_id: 1 } as never, 1)).toBe(true);
    expect(isOwnedStickerPack({ owner_account_id: 1 } as never, undefined)).toBe(false);
    expect(exportableConversations([{ restrict_forwarding: true }, { restrict_forwarding: false }] as never)).toHaveLength(
      1,
    );
    expect(nicknameSearchHits([{ id: 1 }, { id: 2 }] as never, 1)).toEqual([{ id: 2 }]);
    expect(queryListStatus(true, false, true)).toBe("loading");
    expect(queryListStatus(false, true, true)).toBe("error");
    expect(queryListStatus(false, false, true)).toBe("empty");
    expect(queryListStatus(false, false, false)).toBe("ready");
  });
});
