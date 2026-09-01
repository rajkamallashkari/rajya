import { http, HttpResponse, type HttpHandler } from "msw";
import { MS_PER_SECOND } from "@/features/conversations/model/constants";
import type { components, paths } from "@/shared/lib/api/schema";
import { publishMswRealtime } from "@/shared/lib/realtime/msw-bridge";
import {
  ACCENT_BOOT_HEX,
  ACCENT_CONTRAST_NEAR_BLACK,
  SEMANTIC_DEFAULTS,
} from "@/shared/lib/theme/constants";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import type { PreferenceDocument } from "@/shared/lib/config/preferences-registry";
import {
  appendSent,
  findConversation,
  findMessage,
  folderRecords,
  inviteRecords,
  infoFor,
  MESSAGE_STAMP,
  messagingStore,
  pageFor,
  messageSearchHits,
  searchFiltersFromRequest,
  accountSearchHits,
  conversationSearchHits,
  patchMessage,
  peerAccount,
  reactStoredMessage,
  setConversationTicks,
  tombstoneMessage,
  voteStoredPoll,
  closeStoredPoll,
  findPoll,
  VIEWER,
} from "./messaging-store";

type HealthBody = NonNullable<
  paths["/health"]["get"]["responses"][200]["content"]
>["application/json"];
type AdminSetting = components["schemas"]["AdminSetting"];
type AdminFeatureFlag = components["schemas"]["AdminFeatureFlag"];
type AdminTranslationString = components["schemas"]["AdminTranslationString"];
type AdminThemeToken = components["schemas"]["AdminThemeToken"];
type AdminThemeMap = Record<"dark" | "light", AdminThemeToken[]>;

type SessionBody = NonNullable<
  paths["/auth/login"]["post"]["responses"][200]["content"]
>["application/json"];

type AcceptedBody = NonNullable<
  paths["/auth/otp/request"]["post"]["responses"][200]["content"]
>["application/json"];

type OkBody = NonNullable<
  paths["/api/v1/users/me/verify_password"]["post"]["responses"][200]["content"]
>["application/json"];

type PasskeyBody = NonNullable<
  paths["/api/v1/passkeys/register"]["post"]["responses"][201]["content"]
>["application/json"];

type PasskeyListBody = NonNullable<
  paths["/api/v1/passkeys"]["get"]["responses"][200]["content"]
>["application/json"];

type WebauthnOptionsBody = NonNullable<
  paths["/api/v1/passkeys/lock_options"]["post"]["responses"][200]["content"]
>["application/json"];

type CallEnvelopeBody = NonNullable<
  paths["/api/v1/calls"]["post"]["responses"][201]["content"]
>["application/json"];

type IceServersBody = NonNullable<
  paths["/api/v1/calls/ice_servers"]["get"]["responses"][200]["content"]
>["application/json"];

type HandlerMap = { [Path in keyof paths]: HttpHandler };

function actorIdFromRequest(request: Request): number {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const match = /^dev-(\d+)$/.exec(token);
  return match ? Number(match[1]) : VIEWER.id;
}

const readyHealth = {
  status: "ok",
  checks: {
    postgres: { status: "ok" },
    r2: { status: "ok" },
    redis: { status: "ok" },
    solid_queue: { status: "ok" },
  },
} satisfies HealthBody;

const session = {
  token: "test-token",
  account: { id: 1, username: "ada", display_name: "Ada", kind: "human" },
  user: {
    id: 1,
    email: "ada@example.com",
    onboarded: false,
    has_password: true,
    has_passkey: false,
    phone_verified: false,
    is_admin: false,
  },
} satisfies SessionBody;

type MeBody = NonNullable<
  paths["/api/v1/users/me"]["get"]["responses"][200]["content"]
>["application/json"];
type PhoneBody = NonNullable<
  paths["/api/v1/users/me/phone/verification"]["get"]["responses"][200]["content"]
>["application/json"];
type BlockListBody = NonNullable<
  paths["/api/v1/blocks"]["get"]["responses"][200]["content"]
>["application/json"];
type DeviceSessionListBody = NonNullable<
  paths["/api/v1/sessions"]["get"]["responses"][200]["content"]
>["application/json"];
type ContactNicknameListBody = NonNullable<
  paths["/api/v1/contact_nicknames"]["get"]["responses"][200]["content"]
>["application/json"];
type ContactNicknameBody = NonNullable<
  paths["/api/v1/contact_nicknames/{account_id}"]["put"]["responses"][200]["content"]
>["application/json"];

const me = {
  account: session.account,
  user: session.user,
} satisfies MeBody;
const phoneVerification = {
  status: "none",
  phone_changed: false,
  code: null,
  wa_url: null,
  confirmed_phone: null,
  expires_at: null,
} satisfies PhoneBody;
const blockList = { blocks: [] } satisfies BlockListBody;
const deviceSessionList = {
  sessions: [
    {
      id: 1,
      device_label: "Phone",
      user_agent: "RajyaSpec/1.0",
      ip: "127.0.0.1",
      last_seen_at: "2026-01-01T00:00:00Z",
      expires_at: "2026-02-01T00:00:00Z",
      current: true,
      revoked: false,
    },
    {
      id: 2,
      device_label: "Laptop",
      user_agent: "Mozilla/5.0",
      ip: "10.0.0.2",
      last_seen_at: "2026-01-02T00:00:00Z",
      expires_at: "2026-02-01T00:00:00Z",
      current: false,
      revoked: false,
    },
  ],
} satisfies DeviceSessionListBody;
const contactNickname = {
  nickname: "Ada",
  account: session.account,
} satisfies ContactNicknameBody;
const contactNicknameList = { nicknames: [contactNickname] } satisfies ContactNicknameListBody;

function bearerToken(request: Request): string {
  return request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
}

function meBodyFor(token: string): MeBody {
  if (token === "admin-token") {
    return {
      account: session.account,
      user: { ...session.user, is_admin: true, onboarded: true },
    };
  }
  if (token === "impersonation-token") {
    return {
      account: peerAccount(2, "Peer"),
      user: { ...session.user, is_admin: true, onboarded: true },
      impersonation: { impersonator_id: 1, account_id: 2, display_name: "Peer" },
    };
  }
  return me;
}

function meResponse({ request }: { request: Request }) {
  return HttpResponse.json(meBodyFor(bearerToken(request)));
}

const accepted = { accepted: true } satisfies AcceptedBody;
const ok = { ok: true } satisfies OkBody;
const passkey = {
  id: 1,
  nickname: "Key",
  last_used_at: null,
  created_at: "2026-01-01T00:00:00Z",
} satisfies PasskeyBody;
const passkeyList = { passkeys: [passkey] } satisfies PasskeyListBody;
const webauthnOptions = {
  challenge: "YQ",
  nonce: "nonce",
  allowCredentials: [],
} satisfies WebauthnOptionsBody;

const sessionResponse = () => HttpResponse.json(session);
const acceptedResponse = () => HttpResponse.json(accepted);
const okResponse = () => HttpResponse.json(ok);
const webauthnResponse = () => HttpResponse.json(webauthnOptions);

const errorBody = {
  error: { code: "not_found", message: "not_found", details: {} },
};

function jsonError(status: number) {
  return HttpResponse.json(errorBody, { status });
}

const filedReports = new Set<string>();

export function resetFiledReports() {
  filedReports.clear();
}

const nimbusBot = {
  id: 1,
  memory_enabled: true,
  owner_account_id: null,
  account: {
    id: 99,
    username: "nimbus",
    display_name: "Nimbus",
    kind: "bot",
    bio: "Sky watcher",
    shared_memory: true,
  },
};

const pendingBotRequest = {
  id: 1,
  kind: "create" as const,
  status: "pending" as const,
  payload: { bio: "Sky", name: "Nimbus", persona_prompt: "A".repeat(80), username: "nimbus" },
  requester_account_id: 1,
  created_at: MESSAGE_STAMP,
};

const namelessBotRequest = {
  id: 3,
  kind: "create" as const,
  status: "pending" as const,
  payload: {},
  requester_account_id: 1,
  created_at: MESSAGE_STAMP,
};

const editBotRequest = {
  ...pendingBotRequest,
  id: 2,
  kind: "edit" as const,
  payload: { username: "nimbus" },
};

function listedAdminUsers(q?: string | null) {
  const rows = [
    {
      id: 1,
      email: "ada@example.com",
      is_admin: true,
      phone_verified: false,
      created_at: MESSAGE_STAMP,
      account: session.account,
    },
    {
      id: 2,
      email: "peer@example.com",
      is_admin: false,
      phone_verified: true,
      created_at: MESSAGE_STAMP,
      account: peerAccount(2, "Peer"),
    },
    {
      id: 3,
      email: null,
      is_admin: false,
      phone_verified: false,
      created_at: MESSAGE_STAMP,
      account: peerAccount(3, "No Email"),
    },
  ];
  const needle = q?.trim().toLowerCase();
  if (!needle) {
    return rows;
  }
  return rows.filter((row) =>
    `${row.email ?? ""} ${row.account.display_name} ${row.account.username}`
      .toLowerCase()
      .includes(needle),
  );
}

let promptTemplates = [
  {
    capability: "bot_reply",
    version: 1,
    template: "You are helpful.",
    active: true,
    default: "You are helpful.",
    overridden: false,
  },
  {
    capability: "rewrite",
    version: null,
    template: "Rewrite this.",
    active: true,
    default: "Rewrite this.",
    overridden: false,
  },
];

const dashboardBody = {
  buckets: [
    {
      service_name: "r2",
      status: "ok",
      used_bytes: 10,
      capacity_bytes: 100,
      priority: 1,
    },
  ],
  quotas: { storage_bytes: 100, object: { nested: true } },
  ai_usage: [
    { capability: "bot_reply", status: "ok", count: 3, prompt_tokens: 10, completion_tokens: 4 },
  ],
  jobs: { failed: 0, pending: 1 },
};

const auditEvents = [
  {
    id: 1,
    admin_user_id: 1,
    action: "impersonation.start",
    target_type: "Account",
    target_id: 2,
    metadata: { account_id: 2 },
    ip_address: "127.0.0.1",
    created_at: MESSAGE_STAMP,
    impersonated_account: peerAccount(2, "Peer"),
  },
  {
    id: 2,
    admin_user_id: 1,
    action: "transcript.read",
    target_type: "Conversation",
    target_id: 1,
    metadata: {},
    ip_address: null,
    created_at: MESSAGE_STAMP,
  },
];

let styleProfileState = {
  enabled: false,
  profile: null as string | null,
  updated_at: null as string | null,
  message_count: 0,
};

export function resetAiHelpers() {
  styleProfileState = { enabled: false, profile: null, updated_at: null, message_count: 0 };
}

function clonePreferenceDefaults(): PreferenceDocument {
  return structuredClone(preferencesRegistry.defaults) as PreferenceDocument;
}

let preferenceState = {
  data: clonePreferenceDefaults(),
  updated_at: MESSAGE_STAMP as string | null,
};

export function resetPreferences() {
  preferenceState = { data: clonePreferenceDefaults(), updated_at: MESSAGE_STAMP };
}

export function seedPreferenceOverlay(overlay: Record<string, unknown>) {
  preferenceState = {
    data: deepMerge(
      clonePreferenceDefaults() as unknown as Record<string, unknown>,
      overlay,
    ) as unknown as PreferenceDocument,
    updated_at: MESSAGE_STAMP,
  };
}

const adminSetting = {
  key: "message_edit_window",
  type: "integer",
  category: "messaging",
  default: 900,
  description: "Seconds after send during which the sender may edit (BR-2, 15 min).",
  min: 1,
  max: 86400,
  allow_nil: false,
  value: 900,
  overridden: false,
} satisfies AdminSetting;

const adminArraySetting = {
  key: "gif_providers",
  type: "array",
  category: "",
  default: [],
  description: "GIF search providers.",
  value: ["tenor"],
  overridden: false,
} satisfies AdminSetting;

const adminFlag = {
  key: "webrtc_calls",
  description: "P2P audio/video via Cable signaling.",
  default: false,
  enabled: false,
  overridden: false,
  rollout: {},
} satisfies AdminFeatureFlag;

const adminString = {
  key: "errors.not_found",
  locale: "en",
  surface: "errors",
  default: "The requested resource could not be found.",
  value: "The requested resource could not be found.",
  overridden: false,
} satisfies AdminTranslationString;

const adminScreenString = {
  key: "admin.title",
  locale: "en",
  surface: "admin",
  default: "Admin",
  value: "Admin",
  overridden: false,
} satisfies AdminTranslationString;

const adminOptionalString = {
  key: "admin.optional",
  locale: "en",
  surface: "admin",
  default: null,
  value: "Optional",
  overridden: false,
} satisfies AdminTranslationString;

const adminToken = {
  token_name: "--text-primary",
  default: SEMANTIC_DEFAULTS.light["--text-primary"],
  value: SEMANTIC_DEFAULTS.light["--text-primary"],
  overridden: false,
} satisfies AdminThemeToken;

const adminDarkToken = {
  ...adminToken,
  default: SEMANTIC_DEFAULTS.dark["--text-primary"],
  value: SEMANTIC_DEFAULTS.dark["--text-primary"],
};

let adminSettings: AdminSetting[] = [adminSetting, adminArraySetting];
let adminFlags: AdminFeatureFlag[] = [adminFlag];
let adminStrings: AdminTranslationString[] = [adminString, adminScreenString, adminOptionalString];
let adminThemes: AdminThemeMap = {
  light: [adminToken],
  dark: [adminDarkToken],
};
let themePalette: components["schemas"]["ThemeOverridePalette"] = { light: {}, dark: {} };

export function resetAdminConfig() {
  adminSettings = [{ ...adminSetting }, { ...adminArraySetting, value: ["tenor"] }];
  adminFlags = [{ ...adminFlag, rollout: {} }];
  adminStrings = [{ ...adminString }, { ...adminScreenString }, { ...adminOptionalString }];
  adminThemes = {
    light: [{ ...adminToken }],
    dark: [{ ...adminDarkToken }],
  };
  themePalette = { light: {}, dark: {} };
  promptTemplates = [
    {
      capability: "bot_reply",
      version: 1,
      template: "You are helpful.",
      active: true,
      default: "You are helpful.",
      overridden: false,
    },
    {
      capability: "rewrite",
      version: null,
      template: "Rewrite this.",
      active: true,
      default: "Rewrite this.",
      overridden: false,
    },
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const existing = next[key];
    next[key] = isRecord(existing) && isRecord(value) ? deepMerge(existing, value) : value;
  }
  return next;
}

const translationBody = {
  text: "Hello",
  source_language: "es",
  target_language: "en",
  cached: false,
};

const scheduled = {
  id: 1,
  conversation_id: 1,
  body: "later",
  scheduled_at: MESSAGE_STAMP,
  created_at: MESSAGE_STAMP,
  occurrences_sent: 0,
  recurrence_rule: "FREQ=DAILY",
  next_run_at: MESSAGE_STAMP,
};
const savedReply = {
  id: 1,
  shortcut: "/omw",
  body: "On my way",
  position: 0,
  created_at: MESSAGE_STAMP,
  updated_at: MESSAGE_STAMP,
};
const stickerItem = {
  id: 1,
  position: 0,
  shortcode: "wave",
  sticker_pack_id: 1,
  url: "https://media.test/sticker.png",
};
const stickerPack = {
  created_at: MESSAGE_STAMP,
  id: 1,
  kind: "sticker" as const,
  name: "Waves",
  owner_account_id: null,
  position: 0,
  published_at: MESSAGE_STAMP,
  slug: "waves",
  stickers: [stickerItem],
  updated_at: MESSAGE_STAMP,
};
const gifItem = {
  id: "tenor-1",
  preview_url: "https://media.test/gif.gif",
  title: "Party",
};
const messageReminder = {
  id: 1,
  message_id: 101,
  remind_at: MESSAGE_STAMP,
  note: "Ping",
  completed_at: null,
  created_at: MESSAGE_STAMP,
};

const iceServersBody = {
  ice_servers: [{ urls: "stun:stun.l.google.com:19302" }],
} satisfies IceServersBody;

function callParticipant(id: number, accountId: number, status: string, joined: boolean) {
  return {
    id,
    account_id: accountId,
    status,
    joined_at: joined ? MESSAGE_STAMP : null,
    is_screen_sharing: false,
  };
}

export function actorLabel(id: number): { name: string; username: string } {
  if (id === VIEWER.id) {
    return { name: VIEWER.display_name, username: VIEWER.username };
  }
  if (id === 2) {
    return { name: "Grace", username: "grace" };
  }
  return { name: `user${String(id)}`, username: `user${String(id)}` };
}

function callEnvelope(
  id: number,
  status: string,
  kind = "audio",
  initiatorId = VIEWER.id,
  conversationId = 1,
): CallEnvelopeBody {
  const joined = status === "active";
  const peerId = initiatorId === VIEWER.id ? 2 : VIEWER.id;
  return {
    call: {
      id,
      conversation_id: conversationId,
      initiator_account_id: initiatorId,
      kind,
      status,
      created_at: MESSAGE_STAMP,
      started_at: joined ? MESSAGE_STAMP : null,
      ended_at: status === "ringing" || joined ? null : MESSAGE_STAMP,
      participants: [
        callParticipant(1, initiatorId, "joined", true),
        callParticipant(2, peerId, joined ? "joined" : "ringing", joined),
      ],
    },
    ice_servers: iceServersBody.ice_servers,
  };
}

function invitePreview(token: string) {
  if (token === "gone") {
    return null;
  }
  const pending = inviteRecords().pendingTokens.has(token) || token === "pending";
  return {
    already_member: token === "member" || token === "member-bare",
    avatar_url: null,
    conversation_id: token === "member-bare" || token === "orphan" ? null : 2,
    kind: token === "channel" ? "channel" : "group",
    member_count: 3,
    pending_request: pending,
    requires_approval: token === "approval" || token === "pending",
    title: token === "untitled" ? null : token === "channel" ? "News" : "Team",
    usable: token !== "spent",
  };
}

function inviteJoin(token: string) {
  if (token === "gone") {
    return jsonError(404);
  }
  if (token === "fail") {
    return jsonError(409);
  }
  if (token === "approval" || token === "pending") {
    inviteRecords().pendingTokens.add(token);
    return HttpResponse.json({ status: "pending_approval" });
  }
  if (token === "bare" || token === "orphan") {
    return HttpResponse.json({ status: "joined" });
  }
  if (token === "member-bare") {
    return HttpResponse.json({ status: "already_member" });
  }
  return HttpResponse.json({ conversation: findConversation(2), status: "joined" });
}

export const handlerMap = {
  "/health": http.get("*/health", () => HttpResponse.json(readyHealth)),
  "/up": http.get("*/up", () => new HttpResponse(null, { status: 200 })),
  "/auth/google": http.post("*/auth/google", sessionResponse),
  "/auth/login": http.post("*/auth/login", sessionResponse),
  "/auth/register": http.post("*/auth/register", sessionResponse),
  "/auth/forgot_password": http.post("*/auth/forgot_password", acceptedResponse),
  "/auth/reset_password": http.post("*/auth/reset_password", sessionResponse),
  "/auth/otp/request": http.post("*/auth/otp/request", acceptedResponse),
  "/auth/otp/verify": http.post("*/auth/otp/verify", sessionResponse),
  "/auth/magic_link/request": http.post("*/auth/magic_link/request", acceptedResponse),
  "/auth/magic_link/verify": http.post("*/auth/magic_link/verify", sessionResponse),
  "/auth/passkeys/authentication_options": http.post(
    "*/auth/passkeys/authentication_options",
    webauthnResponse,
  ),
  "/auth/passkeys/authenticate": http.post("*/auth/passkeys/authenticate", sessionResponse),
  "/api/v1/passkeys": http.get("*/api/v1/passkeys", () => HttpResponse.json(passkeyList)),
  "/api/v1/passkeys/registration_options": http.post(
    "*/api/v1/passkeys/registration_options",
    webauthnResponse,
  ),
  "/api/v1/passkeys/register": http.post("*/api/v1/passkeys/register", () =>
    HttpResponse.json(passkey, { status: 201 }),
  ),
  "/api/v1/passkeys/lock_options": http.post("*/api/v1/passkeys/lock_options", webauthnResponse),
  "/api/v1/passkeys/assert_lock": http.post("*/api/v1/passkeys/assert_lock", okResponse),
  "/api/v1/passkeys/{id}": http.all("*/api/v1/passkeys/:id", ({ request }) => {
    if (request.method === "PATCH") {
      return HttpResponse.json(passkey);
    }
    return HttpResponse.json(ok);
  }),
  "/api/v1/preferences": http.all("*/api/v1/preferences", async ({ request }) => {
    if (request.method === "PATCH") {
      const body = (await request.json()) as { data?: Record<string, unknown> };
      const overlay = isRecord(body.data) ? body.data : {};
      preferenceState = {
        data: deepMerge(
          preferenceState.data as unknown as Record<string, unknown>,
          overlay,
        ) as unknown as PreferenceDocument,
        updated_at: MESSAGE_STAMP,
      };
    }
    return HttpResponse.json(preferenceState);
  }),
  "/api/v1/font_configs": http.get("*/api/v1/font_configs", () =>
    HttpResponse.json({
      font_configs: [
        {
          id: 1,
          name: "System",
          font_family_value: "inherit",
          google_font_url: null,
          position: 0,
        },
        {
          id: 2,
          name: "Inter",
          font_family_value: "Inter, sans-serif",
          google_font_url:
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
          position: 1,
        },
      ],
    }),
  ),
  "/api/v1/accent_configs": http.get("*/api/v1/accent_configs", () =>
    HttpResponse.json({
      accent_configs: [
        {
          id: "cyber_indigo",
          label: "Cyber Indigo",
          hex: ACCENT_BOOT_HEX,
          is_light_compatible: true,
          is_dark_compatible: true,
          position: 0,
        },
        {
          id: "ember",
          label: "Ember",
          hex: ACCENT_CONTRAST_NEAR_BLACK,
          is_light_compatible: true,
          is_dark_compatible: true,
          position: 1,
        },
      ],
    }),
  ),
  "/api/v1/conversations/{id}/wallpaper": http.patch(
    "*/api/v1/conversations/:id/wallpaper",
    async ({ params, request }) => {
      const conversation = findConversation(Number(params.id));
      if (!conversation) {
        return jsonError(404);
      }
      const body = (await request.json()) as {
        wallpaper?: components["schemas"]["Wallpaper"] | null;
      };
      conversation.wallpaper = body.wallpaper ?? undefined;
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/users/me/password": http.all("*/api/v1/users/me/password", ({ request }) => {
    if (request.method === "PATCH") {
      return HttpResponse.json(session);
    }
    return HttpResponse.json(ok);
  }),
  "/api/v1/users/me/verify_password": http.post("*/api/v1/users/me/verify_password", okResponse),
  "/api/v1/users/me/email": http.delete("*/api/v1/users/me/email", okResponse),
  "/api/v1/users/me/google": http.delete("*/api/v1/users/me/google", okResponse),
  "/api/v1/users/me": http.all("*/api/v1/users/me", ({ request }) => {
    if (request.method === "DELETE") {
      return HttpResponse.json(ok);
    }
    return meResponse({ request });
  }),
  "/api/v1/users/me/complete_onboarding": http.post(
    "*/api/v1/users/me/complete_onboarding",
    meResponse,
  ),
  "/api/v1/users/me/email/change": http.post("*/api/v1/users/me/email/change", acceptedResponse),
  "/api/v1/users/me/email/verify": http.post("*/api/v1/users/me/email/verify", meResponse),
  "/api/v1/users/me/phone/verification": http.all("*/api/v1/users/me/phone/verification", () =>
    HttpResponse.json(phoneVerification),
  ),
  "/api/v1/accounts/username": http.get("*/api/v1/accounts/username", () =>
    HttpResponse.json({ available: true }),
  ),
  "/api/v1/accounts/search": http.get("*/api/v1/accounts/search", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return HttpResponse.json({ accounts: accountSearchHits(q) });
  }),
  "/api/v1/accounts/{id}": http.get("*/api/v1/accounts/:id", () =>
    HttpResponse.json(session.account),
  ),
  "/api/v1/attachments/{id}/download": http.get("*/api/v1/attachments/:id/download", () =>
    HttpResponse.json({
      expires_at: "2099-01-01T00:00:00.000Z",
      url: "https://media.test/file",
    }),
  ),
  "/api/v1/attachments/{id}/thumbnail": http.get("*/api/v1/attachments/:id/thumbnail", () =>
    HttpResponse.json({
      expires_at: "2099-01-01T00:00:00.000Z",
      url: "https://media.test/thumb",
    }),
  ),
  "/api/v1/attachments/{id}/retry": http.post("*/api/v1/attachments/:id/retry", () =>
    HttpResponse.json({
      byte_size: 1,
      content_type: "image/png",
      id: 1,
      kind: "image",
      processing_status: "pending",
    }),
  ),
  "/api/v1/attachments/{id}/transcribe": http.post("*/api/v1/attachments/:id/transcribe", () =>
    HttpResponse.json({
      byte_size: 1,
      content_type: "audio/ogg",
      id: 1,
      kind: "voice",
      processing_status: "ready",
      transcript_status: "pending",
    }),
  ),
  "/api/v1/direct_uploads": http.post("*/api/v1/direct_uploads", () =>
    HttpResponse.json({
      blob_signed_id: "signed",
      skip_upload: true,
    }),
  ),
  "/api/v1/export_jobs": http.all("*/api/v1/export_jobs", ({ request }) => {
    const job = {
      created_at: MESSAGE_STAMP,
      expires_at: "2099-01-01T00:00:00.000Z",
      format: "json" as const,
      id: 1,
      include_media: false,
      status: "pending" as const,
    };
    if (request.method === "POST") {
      return HttpResponse.json(job, { status: 201 });
    }
    return HttpResponse.json({ export_jobs: [job] });
  }),
  "/api/v1/export_jobs/{id}": http.get("*/api/v1/export_jobs/:id", () =>
    HttpResponse.json({
      created_at: MESSAGE_STAMP,
      expires_at: "2099-01-01T00:00:00.000Z",
      format: "json",
      id: 1,
      include_media: false,
      status: "pending",
    }),
  ),
  "/api/v1/export_jobs/{id}/download": http.get("*/api/v1/export_jobs/:id/download", () =>
    HttpResponse.json({
      expires_at: "2099-01-01T00:00:00.000Z",
      url: "https://media.test/export",
    }),
  ),
  "/api/v1/gifs": http.get("*/api/v1/gifs", ({ request }) => {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    if (query === "fail") {
      return jsonError(404);
    }
    return HttpResponse.json({ gifs: [gifItem] });
  }),
  "/api/v1/blocks": http.all("*/api/v1/blocks", ({ request }) => {
    if (request.method === "POST") {
      return HttpResponse.json({ account: session.account }, { status: 201 });
    }
    return HttpResponse.json(blockList);
  }),
  "/api/v1/blocks/{id}": http.delete("*/api/v1/blocks/:id", okResponse),
  "/api/v1/sessions": http.get("*/api/v1/sessions", () => HttpResponse.json(deviceSessionList)),
  "/api/v1/sessions/others": http.delete("*/api/v1/sessions/others", okResponse),
  "/api/v1/sessions/{id}": http.delete("*/api/v1/sessions/:id", okResponse),
  "/api/v1/contact_nicknames": http.get("*/api/v1/contact_nicknames", () =>
    HttpResponse.json(contactNicknameList),
  ),
  "/api/v1/contact_nicknames/{account_id}": http.all(
    "*/api/v1/contact_nicknames/:account_id",
    ({ request }) => {
      if (request.method === "PUT") {
        return HttpResponse.json(contactNickname);
      }
      return HttpResponse.json(ok);
    },
  ),
  "/api/v1/admin/users/{user_id}/verify_phone": http.post(
    "*/api/v1/admin/users/:user_id/verify_phone",
    meResponse,
  ),
  "/webhooks/whatsapp": http.all("*/webhooks/whatsapp", ({ request }) => {
    if (request.method === "GET") {
      return new HttpResponse("challenge-token", {
        status: 200,
        headers: { "content-type": "text/plain" },
      });
    }
    return HttpResponse.json(ok);
  }),
  "/api/v1/conversations": http.all("*/api/v1/conversations", ({ request }) => {
    if (request.method === "POST") {
      const first = messagingStore().conversations[0];
      return HttpResponse.json(first, { status: 201 });
    }
    const archived = new URL(request.url).searchParams.get("archived") === "true";
    const conversations = messagingStore().conversations.filter((row) =>
      archived ? Boolean(row.archived_at) : !row.archived_at,
    );
    return HttpResponse.json({ conversations });
  }),
  "/api/v1/conversations/{id}": http.all(
    "*/api/v1/conversations/:id",
    async ({ params, request }) => {
      const conversation = findConversation(Number(params.id));
      if (!conversation) {
        return jsonError(404);
      }
      if (request.method === "PATCH") {
        const body = (await request.json().catch(() => ({}))) as {
          description?: string | null;
          member_permissions?: { [key: string]: string };
          restrict_forwarding?: boolean;
          slow_mode_seconds?: number;
          title?: string | null;
        };
        Object.assign(conversation, {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.member_permissions !== undefined
            ? { member_permissions: body.member_permissions }
            : {}),
          ...(body.slow_mode_seconds !== undefined
            ? { slow_mode_seconds: body.slow_mode_seconds }
            : {}),
          ...(body.restrict_forwarding !== undefined
            ? { restrict_forwarding: body.restrict_forwarding }
            : {}),
        });
      } else {
        conversation.manually_unread_at = null;
      }
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{id}/pin": http.all(
    "*/api/v1/conversations/:id/pin",
    ({ params, request }) => {
      const conversation = findConversation(Number(params.id));
      if (!conversation) {
        return jsonError(404);
      }
      conversation.pinned_at = request.method === "DELETE" ? null : MESSAGE_STAMP;
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{id}/receipts": http.post(
    "*/api/v1/conversations/:id/receipts",
    async ({ params, request }) => {
      const conversation = findConversation(Number(params.id));
      if (!conversation) {
        return jsonError(404);
      }
      const body = (await request.json()) as { kind?: string; position?: number };
      const tick = body.kind === "viewed" ? "read" : "delivered";
      const accountId = actorIdFromRequest(request);
      setConversationTicks(conversation.id, tick, accountId);
      publishMswRealtime({
        type: "receipts_updated",
        conversation_id: conversation.id,
        account_id: accountId,
        kind: tick,
        position: body.position ?? 0,
      });
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{id}/unread": http.all(
    "*/api/v1/conversations/:id/unread",
    ({ params, request }) => {
      const conversation = findConversation(Number(params.id));
      if (!conversation) {
        return jsonError(404);
      }
      conversation.manually_unread_at = request.method === "DELETE" ? null : MESSAGE_STAMP;
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{id}/leave": http.post(
    "*/api/v1/conversations/:id/leave",
    ({ params }) => {
      const conversation = findConversation(Number(params.id));
      if (!conversation) {
        return jsonError(404);
      }
      return okResponse();
    },
  ),
  "/api/v1/conversations/{id}/generations/cancel": http.post(
    "*/api/v1/conversations/:id/generations/cancel",
    async ({ request, params }) => {
      const body = (await request.json()) as { generation_id?: string };
      const generationId = body.generation_id ?? "";
      publishMswRealtime({
        type: "generation_cancelled",
        conversation_id: Number(params.id),
        generation_id: generationId,
      });
      return HttpResponse.json({ generation_id: generationId });
    },
  ),
  "/api/v1/conversations/{id}/media": http.get(
    "*/api/v1/conversations/:id/media",
    ({ params, request }) => {
      if (String(params.id) === "998") {
        return jsonError(500);
      }
      const url = new URL(request.url);
      const kind = url.searchParams.get("kind") ?? "images";
      const page = Number(url.searchParams.get("page") ?? "1");
      if (kind === "links") {
        return HttpResponse.json({
          items: [
            {
              item_kind: "link" as const,
              attachment: null,
              link: {
                url: "https://example.com",
                title: "Example",
                description: "Body",
                site_name: "Ex",
              },
            },
            {
              item_kind: "link" as const,
              attachment: null,
              link: { url: "https://example.org/bare" },
            },
          ],
          meta: { has_more: false, page: 1, per_page: 30, total: 2 },
        });
      }
      const items =
        kind === "images" && page > 1
          ? []
          : [
              {
                item_kind: "attachment" as const,
                attachment: {
                  byte_size: 12,
                  content_type: kind === "files" ? "application/pdf" : "image/png",
                  filename: kind === "files" ? "notes.pdf" : undefined,
                  id: 9,
                  kind: kind === "files" ? ("file" as const) : ("image" as const),
                  message_id: 1,
                  processing_status: "ready" as const,
                  width: 16,
                  height: 9,
                },
                link: null,
              },
            ];
      return HttpResponse.json({
        items,
        meta: {
          has_more: kind === "images" && page === 1,
          page,
          per_page: 30,
          total: kind === "images" ? 2 : items.length,
        },
      });
    },
  ),
  "/api/v1/search": http.get("*/api/v1/search", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const filters = searchFiltersFromRequest(request.url);
    return HttpResponse.json({
      accounts: accountSearchHits(q),
      conversations: conversationSearchHits(q),
      messages: messageSearchHits(q, undefined, filters),
      query: q,
    });
  }),
  "/api/v1/conversations/{id}/search": http.get(
    "*/api/v1/conversations/:id/search",
    ({ params, request }) => {
      const q = new URL(request.url).searchParams.get("q") ?? "";
      return HttpResponse.json({
        messages: messageSearchHits(q, Number(params.id), searchFiltersFromRequest(request.url)),
        query: q,
      });
    },
  ),
  "/api/v1/conversations/{id}/commands": http.get("*/api/v1/conversations/:id/commands", () =>
    HttpResponse.json({
      commands: [
        {
          client_action: "open_sticker_picker",
          description: "Browse stickers",
          name: "sticker",
          source: "builtin",
        },
        {
          client_action: "open_gif_picker",
          description: "Search GIFs",
          name: "gif",
          source: "builtin",
        },
        {
          client_action: null,
          description: "List commands available in this chat",
          name: "help",
          source: "builtin",
        },
        {
          bot_account_id: 2,
          client_action: null,
          description: "Turn a goal into steps",
          name: "plan",
          source: "bot",
          usage_hint: "/plan <goal>",
        },
      ],
    }),
  ),
  "/api/v1/conversations/{id}/archive": http.all(
    "*/api/v1/conversations/:id/archive",
    ({ params, request }) => {
      const conversation = findConversation(Number(params.id));
      if (!conversation) {
        return jsonError(404);
      }
      conversation.archived_at = request.method === "DELETE" ? null : MESSAGE_STAMP;
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{id}/mute": http.all(
    "*/api/v1/conversations/:id/mute",
    async ({ params, request }) => {
      const conversation = findConversation(Number(params.id));
      if (!conversation) {
        return jsonError(404);
      }
      if (request.method === "DELETE") {
        conversation.muted_until = null;
        return HttpResponse.json(conversation);
      }
      const body = (await request.json()) as { duration?: number };
      const duration = body.duration ?? 0;
      conversation.muted_until =
        duration > 0 ? new Date(Date.now() + duration * MS_PER_SECOND).toISOString() : null;
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{conversation_id}/members": http.post(
    "*/api/v1/conversations/:conversation_id/members",
    ({ params }) => {
      const conversation = findConversation(Number(params.conversation_id));
      if (!conversation) {
        return jsonError(404);
      }
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{conversation_id}/members/{account_id}": http.delete(
    "*/api/v1/conversations/:conversation_id/members/:account_id",
    ({ params }) => {
      const conversation = findConversation(Number(params.conversation_id));
      if (!conversation) {
        return jsonError(404);
      }
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{conversation_id}/members/{account_id}/promote": http.patch(
    "*/api/v1/conversations/:conversation_id/members/:account_id/promote",
    ({ params }) => {
      const conversation = findConversation(Number(params.conversation_id));
      if (!conversation) {
        return jsonError(404);
      }
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{conversation_id}/members/{account_id}/demote": http.patch(
    "*/api/v1/conversations/:conversation_id/members/:account_id/demote",
    ({ params }) => {
      const conversation = findConversation(Number(params.conversation_id));
      if (!conversation) {
        return jsonError(404);
      }
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{conversation_id}/members/{account_id}/transfer": http.patch(
    "*/api/v1/conversations/:conversation_id/members/:account_id/transfer",
    ({ params }) => {
      const conversation = findConversation(Number(params.conversation_id));
      if (!conversation) {
        return jsonError(404);
      }
      return HttpResponse.json(conversation);
    },
  ),
  "/api/v1/conversations/{conversation_id}/messages": http.get(
    "*/api/v1/conversations/:conversation_id/messages",
    ({ params, request }) => {
      const url = new URL(request.url);
      const aroundId = url.searchParams.get("around_id");
      const aroundAt = url.searchParams.get("around_at");
      const afterRevision = url.searchParams.get("after_revision");
      const before = url.searchParams.get("before");
      const after = url.searchParams.get("after");
      const page = pageFor(Number(params.conversation_id), {
        around_id: aroundId ? Number(aroundId) : undefined,
        around_at: aroundAt ?? undefined,
        before: before ? Number(before) : undefined,
        after: after ? Number(after) : undefined,
        after_revision: afterRevision ? Number(afterRevision) : undefined,
      });
      if (!page) {
        return jsonError(404);
      }
      return HttpResponse.json(page);
    },
  ),
  "/api/v1/messages/{id}/info": http.get("*/api/v1/messages/:id/info", ({ params }) => {
    const info = infoFor(Number(params.id));
    if (!info) {
      return jsonError(404);
    }
    return HttpResponse.json(info);
  }),
  "/api/v1/messages/{id}/regenerate": http.post(
    "*/api/v1/messages/:id/regenerate",
    ({ params }) => {
      const next = tombstoneMessage(Number(params.id));
      return next ? HttpResponse.json(next) : jsonError(404);
    },
  ),
  "/api/v1/messages": http.post("*/api/v1/messages", async ({ request }) => {
    const body = (await request.json()) as {
      body?: string;
      client_nonce?: string;
      conversation_id?: number;
      silent?: boolean;
    };
    const message = appendSent(
      body.conversation_id ?? 1,
      body.body ?? "",
      body.client_nonce,
      body.silent,
    );
    publishMswRealtime({
      type: "message_created",
      conversation_id: message.conversation_id,
      message_id: message.id,
    });
    return HttpResponse.json(message, { status: 201 });
  }),
  "/api/v1/messages/{id}/forward": http.post(
    "*/api/v1/messages/:id/forward",
    async ({ request, params }) => {
      const body = (await request.json()) as { conversation_id?: number };
      const source = findMessage(Number(params.id));
      return HttpResponse.json(
        appendSent(body.conversation_id ?? 1, source?.body ?? "", undefined),
        { status: 201 },
      );
    },
  ),
  "/api/v1/messages/bulk_unsend": http.post(
    "*/api/v1/messages/bulk_unsend",
    async ({ request }) => {
      const body = (await request.json()) as { message_ids?: number[] };
      const messages = (body.message_ids ?? [])
        .map((id) => tombstoneMessage(id))
        .filter((row): row is NonNullable<typeof row> => Boolean(row));
      return HttpResponse.json({ messages });
    },
  ),
  "/api/v1/messages/bulk_forward": http.post(
    "*/api/v1/messages/bulk_forward",
    async ({ request }) => {
      const body = (await request.json()) as { conversation_id?: number; message_ids?: number[] };
      const messages = (body.message_ids ?? []).map((id) => {
        const source = findMessage(id);
        return appendSent(body.conversation_id ?? 1, source?.body ?? "", undefined);
      });
      return HttpResponse.json({ messages }, { status: 201 });
    },
  ),
  "/api/v1/messages/bulk_save": http.post("*/api/v1/messages/bulk_save", async ({ request }) => {
    const body = (await request.json()) as { message_ids?: number[] };
    const saved_messages = (body.message_ids ?? []).map((id) => {
      const message = findMessage(id);
      return {
        id,
        message_id: id,
        created_at: MESSAGE_STAMP,
        message: message ?? appendSent(1, "", undefined),
      };
    });
    return HttpResponse.json({ saved_messages }, { status: 201 });
  }),
  "/api/v1/messages/{id}": http.all("*/api/v1/messages/:id", async ({ request, params }) => {
    const id = Number(params.id);
    if (request.method === "GET") {
      const message = findMessage(id);
      return message ? HttpResponse.json(message) : jsonError(404);
    }
    if (request.method === "PATCH") {
      const body = (await request.json()) as { body?: string };
      const next = patchMessage(id, body.body ?? "");
      return next ? HttpResponse.json(next) : jsonError(404);
    }
    const next = tombstoneMessage(id);
    return next ? HttpResponse.json(next) : jsonError(404);
  }),
  "/api/v1/messages/{message_id}/reactions/{emoji}": http.delete(
    "*/api/v1/messages/:message_id/reactions/:emoji",
    ({ params }) => {
      const next = reactStoredMessage(Number(params.message_id));
      return next ? HttpResponse.json(next) : jsonError(404);
    },
  ),
  "/api/v1/messages/{message_id}/reactions": http.all(
    "*/api/v1/messages/:message_id/reactions",
    ({ params, request }) => {
      const message = findMessage(Number(params.message_id));
      if (!message) {
        return jsonError(404);
      }
      if (request.method === "GET") {
        const summary = message.reaction_summary ?? {};
        const reactions = Object.keys(summary).map((emoji) => ({
          emoji,
          account: message.sender ?? VIEWER,
        }));
        return HttpResponse.json({ reactions });
      }
      reactStoredMessage(Number(params.message_id));
      return HttpResponse.json(message, { status: 201 });
    },
  ),
  "/api/v1/conversations/{conversation_id}/pins/{message_id}": http.delete(
    "*/api/v1/conversations/:conversation_id/pins/:message_id",
    okResponse,
  ),
  "/api/v1/conversations/{conversation_id}/pins": http.post(
    "*/api/v1/conversations/:conversation_id/pins",
    async ({ request, params }) => {
      const body = (await request.json()) as { message_id?: number };
      const message = findMessage(body.message_id ?? 0);
      if (!message) {
        return jsonError(404);
      }
      return HttpResponse.json(
        {
          id: message.id,
          conversation_id: Number(params.conversation_id),
          message_id: message.id,
          created_at: MESSAGE_STAMP,
          message,
        },
        { status: 201 },
      );
    },
  ),
  "/api/v1/saved_replies/{id}": http.all("*/api/v1/saved_replies/:id", ({ request }) => {
    if (request.method === "PATCH") {
      return HttpResponse.json(savedReply);
    }
    return HttpResponse.json(ok);
  }),
  "/api/v1/saved_replies": http.all("*/api/v1/saved_replies", ({ request }) => {
    if (request.method === "POST") {
      return HttpResponse.json(savedReply, { status: 201 });
    }
    return HttpResponse.json({ saved_replies: [savedReply] });
  }),
  "/api/v1/sticker_packs": http.all("*/api/v1/sticker_packs", ({ request }) => {
    if (request.method === "POST") {
      return HttpResponse.json(stickerPack, { status: 201 });
    }
    return HttpResponse.json({ sticker_packs: [stickerPack] });
  }),
  "/api/v1/sticker_packs/{id}": http.all("*/api/v1/sticker_packs/:id", ({ request }) => {
    if (request.method === "PATCH") {
      return HttpResponse.json(stickerPack);
    }
    return HttpResponse.json(ok);
  }),
  "/api/v1/sticker_packs/{sticker_pack_id}/stickers": http.post(
    "*/api/v1/sticker_packs/:sticker_pack_id/stickers",
    () => HttpResponse.json(stickerItem, { status: 201 }),
  ),
  "/api/v1/sticker_packs/{sticker_pack_id}/stickers/{id}": http.delete(
    "*/api/v1/sticker_packs/:sticker_pack_id/stickers/:id",
    okResponse,
  ),
  "/api/v1/message_reminders/{id}": http.all("*/api/v1/message_reminders/:id", ({ request }) => {
    if (request.method === "PATCH") {
      return HttpResponse.json(messageReminder);
    }
    return HttpResponse.json(ok);
  }),
  "/api/v1/message_reminders": http.all("*/api/v1/message_reminders", ({ request }) => {
    if (request.method === "POST") {
      return HttpResponse.json(messageReminder, { status: 201 });
    }
    return HttpResponse.json({ message_reminders: [messageReminder] });
  }),
  "/api/v1/saved_messages/{id}": http.delete("*/api/v1/saved_messages/:id", okResponse),
  "/api/v1/saved_messages": http.post("*/api/v1/saved_messages", async ({ request }) => {
    const body = (await request.json()) as { message_id?: number };
    const message = findMessage(body.message_id ?? 0);
    if (!message) {
      return jsonError(404);
    }
    return HttpResponse.json(
      { id: message.id, message_id: message.id, created_at: MESSAGE_STAMP, message },
      { status: 201 },
    );
  }),
  "/api/v1/scheduled_messages": http.all("*/api/v1/scheduled_messages", ({ request }) => {
    if (request.method === "POST") {
      return HttpResponse.json(scheduled, { status: 201 });
    }
    return HttpResponse.json({ scheduled_messages: [scheduled] });
  }),
  "/api/v1/scheduled_messages/{id}/send_now": http.post(
    "*/api/v1/scheduled_messages/:id/send_now",
    () => HttpResponse.json(appendSent(1, scheduled.body), { status: 201 }),
  ),
  "/api/v1/scheduled_messages/{id}": http.all("*/api/v1/scheduled_messages/:id", ({ request }) => {
    if (request.method === "PATCH") {
      return HttpResponse.json(scheduled);
    }
    return HttpResponse.json(ok);
  }),
  "/api/v1/polls/{id}/vote": http.post("*/api/v1/polls/:id/vote", async ({ request, params }) => {
    const body = (await request.json()) as { option_ids?: number[] };
    const next = voteStoredPoll(Number(params.id), body.option_ids ?? []);
    return next ? HttpResponse.json(next) : jsonError(404);
  }),
  "/api/v1/polls/{id}/close": http.post("*/api/v1/polls/:id/close", ({ params }) => {
    const next = closeStoredPoll(Number(params.id));
    return next ? HttpResponse.json(next) : jsonError(404);
  }),
  "/api/v1/polls/{id}": http.get("*/api/v1/polls/:id", ({ params }) => {
    const poll = findPoll(Number(params.id));
    return poll ? HttpResponse.json(poll) : jsonError(404);
  }),
  "/api/v1/push_subscriptions/vapid": http.get("*/api/v1/push_subscriptions/vapid", () =>
    HttpResponse.json({ public_key: "vapid-public" }),
  ),
  "/api/v1/push_subscriptions": http.all("*/api/v1/push_subscriptions", ({ request }) => {
    if (request.method === "POST") {
      return HttpResponse.json({ id: 1, endpoint: "https://push.example/1" }, { status: 201 });
    }
    return HttpResponse.json(ok);
  }),
  "/api/v1/reports/reasons": http.get("*/api/v1/reports/reasons", () =>
    HttpResponse.json({
      reasons: [{ id: "spam", label: "Spam" }],
    }),
  ),
  "/api/v1/reports": http.post("*/api/v1/reports", async ({ request }) => {
    const body = (await request.json()) as {
      details?: string;
      reason?: string;
      subject_id?: number;
      subject_type?: string;
    };
    const key = `${body.subject_type}:${String(body.subject_id)}`;
    if (filedReports.has(key)) {
      return jsonError(409);
    }
    filedReports.add(key);
    return HttpResponse.json(
      {
        id: filedReports.size,
        subject_type: body.subject_type,
        subject_id: body.subject_id,
        reason: body.reason,
        details: body.details ?? null,
        status: "pending",
        created_at: MESSAGE_STAMP,
      },
      { status: 201 },
    );
  }),
  "/api/v1/conversations/{conversation_id}/invites": http.all(
    "*/api/v1/conversations/:conversation_id/invites",
    async ({ request }) => {
      const records = inviteRecords();
      if (request.method === "POST") {
        const body = (await request.json()) as {
          expires_in_seconds?: number | null;
          max_uses?: number | null;
          requires_approval?: boolean;
        };
        const created = {
          created_at: MESSAGE_STAMP,
          expires_at: null,
          id: records.nextInviteId,
          max_uses: body.max_uses ?? null,
          requires_approval: body.requires_approval ?? false,
          token: `tok-${String(records.nextInviteId)}`,
          usable: true,
          uses_count: 0,
        };
        records.nextInviteId += 1;
        records.invites.push(created);
        return HttpResponse.json(created, { status: 201 });
      }
      return HttpResponse.json({ invites: records.invites });
    },
  ),
  "/api/v1/conversations/{conversation_id}/invites/{id}": http.delete(
    "*/api/v1/conversations/:conversation_id/invites/:id",
    ({ params }) => {
      const records = inviteRecords();
      records.invites = records.invites.filter((invite) => invite.id !== Number(params.id));
      return HttpResponse.json(ok);
    },
  ),
  "/api/v1/invites/{token}": http.get("*/api/v1/invites/:token", ({ params }) => {
    const preview = invitePreview(String(params.token));
    return preview ? HttpResponse.json(preview) : jsonError(404);
  }),
  "/api/v1/invites/{token}/join": http.post("*/api/v1/invites/:token/join", ({ params }) => {
    return inviteJoin(String(params.token));
  }),
  "/api/v1/conversations/{conversation_id}/join_requests": http.get(
    "*/api/v1/conversations/:conversation_id/join_requests",
    () => HttpResponse.json({ join_requests: inviteRecords().requests }),
  ),
  "/api/v1/conversations/{conversation_id}/join_requests/{id}/approve": http.post(
    "*/api/v1/conversations/:conversation_id/join_requests/:id/approve",
    ({ params }) => {
      const records = inviteRecords();
      const id = Number(params.id);
      records.requests = records.requests.filter((request) => request.id !== id);
      const conversation = findConversation(Number(params.conversation_id));
      return conversation ? HttpResponse.json(conversation) : jsonError(404);
    },
  ),
  "/api/v1/conversations/{conversation_id}/join_requests/{id}/reject": http.post(
    "*/api/v1/conversations/:conversation_id/join_requests/:id/reject",
    ({ params }) => {
      const records = inviteRecords();
      records.requests = records.requests.filter((request) => request.id !== Number(params.id));
      return HttpResponse.json(ok);
    },
  ),
  "/api/v1/conversation_folders": http.all("*/api/v1/conversation_folders", async ({ request }) => {
    const records = folderRecords();
    if (request.method === "POST") {
      const body = (await request.json()) as { name?: string; position?: number };
      const created = {
        id: records.nextId,
        name: body.name ?? "Folder",
        position: body.position ?? records.folders.length,
        conversation_ids: [] as number[],
      };
      records.nextId += 1;
      records.folders.push(created);
      return HttpResponse.json(created, { status: 201 });
    }
    return HttpResponse.json({ folders: records.folders });
  }),
  "/api/v1/conversation_folders/reorder": http.patch(
    "*/api/v1/conversation_folders/reorder",
    async ({ request }) => {
      const records = folderRecords();
      const body = (await request.json()) as { ids?: number[] };
      const ids = body.ids ?? [];
      const byId = new Map(records.folders.map((folder) => [folder.id, folder]));
      records.folders = ids
        .map((id, position) => {
          const folder = byId.get(id);
          return folder ? { ...folder, position } : null;
        })
        .filter((folder): folder is (typeof records.folders)[number] => folder != null);
      return HttpResponse.json({ folders: records.folders });
    },
  ),
  "/api/v1/conversation_folders/{id}": http.all(
    "*/api/v1/conversation_folders/:id",
    async ({ params, request }) => {
      const records = folderRecords();
      const id = Number(params.id);
      const folder = records.folders.find((row) => row.id === id);
      if (!folder) {
        return jsonError(404);
      }
      if (request.method === "DELETE") {
        records.folders = records.folders.filter((row) => row.id !== id);
        return okResponse();
      }
      const body = (await request.json()) as { name?: string; position?: number };
      folder.name = body.name ?? folder.name;
      folder.position = body.position ?? folder.position;
      return HttpResponse.json(folder);
    },
  ),
  "/api/v1/conversation_folders/{conversation_folder_id}/conversations": http.post(
    "*/api/v1/conversation_folders/:conversation_folder_id/conversations",
    async ({ params, request }) => {
      const records = folderRecords();
      const folder = records.folders.find(
        (row) => row.id === Number(params.conversation_folder_id),
      );
      if (!folder) {
        return jsonError(404);
      }
      const body = (await request.json()) as { conversation_id?: number };
      const conversationId = body.conversation_id ?? 0;
      if (conversationId && !folder.conversation_ids.includes(conversationId)) {
        folder.conversation_ids = [...folder.conversation_ids, conversationId];
      }
      return HttpResponse.json(folder);
    },
  ),
  "/api/v1/conversation_folders/{conversation_folder_id}/conversations/{conversation_id}":
    http.delete(
      "*/api/v1/conversation_folders/:conversation_folder_id/conversations/:conversation_id",
      ({ params }) => {
        const records = folderRecords();
        const folder = records.folders.find(
          (row) => row.id === Number(params.conversation_folder_id),
        );
        if (!folder) {
          return jsonError(404);
        }
        const conversationId = Number(params.conversation_id);
        folder.conversation_ids = folder.conversation_ids.filter((id) => id !== conversationId);
        return HttpResponse.json(folder);
      },
    ),
  "/api/v1/ai/rewrite": http.post("*/api/v1/ai/rewrite", () =>
    HttpResponse.json({ suggested_chips: ["casual"], text: "Hello" }),
  ),
  "/api/v1/ai/translate_text": http.post("*/api/v1/ai/translate_text", () =>
    HttpResponse.json(translationBody),
  ),
  "/api/v1/bots": http.get("*/api/v1/bots", () => HttpResponse.json({ bots: [nimbusBot] })),
  "/api/v1/bots/{id}": http.get("*/api/v1/bots/:id", ({ params }) => {
    if (Number(params.id) !== nimbusBot.id) {
      return jsonError(404);
    }
    return HttpResponse.json(nimbusBot);
  }),
  "/api/v1/bot_requests": http.all("*/api/v1/bot_requests", async ({ request }) => {
    if (request.method === "POST") {
      return HttpResponse.json(
        {
          id: 1,
          kind: "create",
          status: "pending",
          payload: {
            bio: "Sky",
            name: "Nimbus",
            persona_prompt: "A".repeat(80),
            username: "nimbus",
          },
        },
        { status: 201 },
      );
    }
    return HttpResponse.json({ bot_requests: [] });
  }),
  "/api/v1/bot_requests/{id}": http.delete("*/api/v1/bot_requests/:id", () =>
    HttpResponse.json({ ok: true }),
  ),
  "/api/v1/admin/bot_requests": http.get("*/api/v1/admin/bot_requests", () =>
    HttpResponse.json({ bot_requests: [pendingBotRequest, editBotRequest, namelessBotRequest] }),
  ),
  "/api/v1/admin/bot_requests/{id}/approve": http.post(
    "*/api/v1/admin/bot_requests/:id/approve",
    () => HttpResponse.json(nimbusBot),
  ),
  "/api/v1/admin/bot_requests/{id}/decline": http.post(
    "*/api/v1/admin/bot_requests/:id/decline",
    () =>
      HttpResponse.json({
        id: 1,
        kind: "create",
        status: "declined",
        payload: {},
      }),
  ),
  "/api/v1/admin/settings": http.all("*/api/v1/admin/settings", async ({ request }) => {
    if (request.method === "PATCH") {
      const body = (await request.json()) as { key?: string; value?: unknown };
      adminSettings = adminSettings.map((row) =>
        row.key === body.key ? { ...row, value: body.value, overridden: true } : row,
      );
      const setting = adminSettings.find((row) => row.key === body.key) ?? {
        ...adminSetting,
        key: body.key ?? adminSetting.key,
        value: body.value,
        overridden: true,
      };
      return HttpResponse.json({ setting });
    }
    if (request.method === "DELETE") {
      const key = new URL(request.url).searchParams.get("key");
      adminSettings = adminSettings.map((row) =>
        row.key === key ? { ...row, value: row.default, overridden: false } : row,
      );
      return HttpResponse.json({
        setting: adminSettings.find((row) => row.key === key) ?? adminSetting,
      });
    }
    return HttpResponse.json({ settings: adminSettings, unregistered_keys: [] });
  }),
  "/api/v1/admin/feature_flags": http.all("*/api/v1/admin/feature_flags", async ({ request }) => {
    if (request.method === "PATCH") {
      const body = (await request.json()) as {
        enabled?: boolean;
        key?: string;
        rollout?: Record<string, unknown>;
      };
      adminFlags = adminFlags.map((row) =>
        row.key === body.key
          ? {
              ...row,
              enabled: Boolean(body.enabled),
              overridden: true,
              rollout: body.rollout ?? {},
            }
          : row,
      );
      return HttpResponse.json({
        feature_flag: adminFlags.find((row) => row.key === body.key) ?? adminFlag,
      });
    }
    return HttpResponse.json({ feature_flags: adminFlags, unregistered_keys: [] });
  }),
  "/api/v1/admin/translation_strings": http.all(
    "*/api/v1/admin/translation_strings",
    async ({ request }) => {
      if (request.method === "PATCH") {
        const body = (await request.json()) as { key?: string; value?: string; locale?: string };
        adminStrings = adminStrings.map((row) =>
          row.key === body.key ? { ...row, value: body.value ?? row.value, overridden: true } : row,
        );
        return HttpResponse.json({
          translation_string: adminStrings.find((row) => row.key === body.key) ?? adminString,
        });
      }
      if (request.method === "DELETE") {
        const key = new URL(request.url).searchParams.get("key");
        adminStrings = adminStrings.map((row) =>
          row.key === key ? { ...row, value: row.default ?? row.value, overridden: false } : row,
        );
        return HttpResponse.json({
          translation_string: adminStrings.find((row) => row.key === key) ?? adminString,
        });
      }
      const q = new URL(request.url).searchParams.get("q") ?? "";
      const surface = new URL(request.url).searchParams.get("surface") ?? "";
      const translation_strings = adminStrings.filter((row) => {
        if (surface && row.surface !== surface) {
          return false;
        }
        if (q && !`${row.key}${row.value}`.includes(q)) {
          return false;
        }
        return true;
      });
      return HttpResponse.json({ translation_strings });
    },
  ),
  "/api/v1/admin/theme_overrides": http.all(
    "*/api/v1/admin/theme_overrides",
    async ({ request }) => {
      if (request.method === "PATCH") {
        const body = (await request.json()) as {
          theme?: string;
          token_name?: string;
          value?: string;
        };
        if (body.value === SEMANTIC_DEFAULTS.light["--surface-app"]) {
          return HttpResponse.json(
            {
              error: {
                code: "validation_failed",
                message: "contrast",
                details: { pair: { token: "--text-primary", against: "--surface-app" } },
              },
            },
            { status: 422 },
          );
        }
        const theme = body.theme === "dark" ? "dark" : "light";
        const tokenName = body.token_name ?? "--text-primary";
        const tokens = adminThemes[theme];
        adminThemes = {
          ...adminThemes,
          [theme]: tokens.map((token) =>
            token.token_name === tokenName
              ? { ...token, value: body.value ?? token.value, overridden: true }
              : token,
          ),
        };
        themePalette = {
          ...themePalette,
          [theme]: { ...themePalette[theme], [tokenName]: body.value ?? "" },
        };
        const override =
          adminThemes[theme].find((token) => token.token_name === tokenName) ?? adminToken;
        return HttpResponse.json({ override });
      }
      if (request.method === "DELETE") {
        resetAdminConfig();
        return HttpResponse.json({ themes: adminThemes });
      }
      return HttpResponse.json({ themes: adminThemes });
    },
  ),
  "/api/v1/admin/users": http.get("*/api/v1/admin/users", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q");
    return HttpResponse.json({ users: listedAdminUsers(q) });
  }),
  "/api/v1/admin/users/{id}": http.get("*/api/v1/admin/users/:id", ({ params }) => {
    const user = listedAdminUsers().find((row) => row.id === Number(params.id));
    if (!user) {
      return jsonError(404);
    }
    return HttpResponse.json({
      user,
      conversations: messagingStore().conversations.map((conversation) => ({
        id: conversation.id,
        kind: conversation.kind,
        title: conversation.title,
        last_activity_at: conversation.last_activity_at,
        member_count: conversation.members.length,
      })),
    });
  }),
  "/api/v1/admin/conversations/{conversation_id}/messages": http.get(
    "*/api/v1/admin/conversations/:conversation_id/messages",
    ({ params, request }) => {
      const conversation = findConversation(Number(params.conversation_id));
      if (!conversation) {
        return jsonError(404);
      }
      const url = new URL(request.url);
      const before = url.searchParams.get("before");
      const after = url.searchParams.get("after");
      const page = pageFor(Number(params.conversation_id), {
        before: before ? Number(before) : undefined,
        after: after ? Number(after) : undefined,
      });
      return HttpResponse.json(page);
    },
  ),
  "/api/v1/admin/impersonation": http.all("*/api/v1/admin/impersonation", async ({ request }) => {
    if (request.method === "DELETE") {
      return HttpResponse.json(ok);
    }
    const body = (await request.json()) as { account_id?: number };
    const accountId = body.account_id ?? 2;
    return HttpResponse.json({
      token: "impersonation-token",
      account: accountId === 1 ? session.account : peerAccount(accountId, "Peer"),
      user: { ...session.user, is_admin: true, onboarded: true },
    });
  }),
  "/api/v1/admin/audit_events": http.get("*/api/v1/admin/audit_events", ({ request }) => {
    const actionName = new URL(request.url).searchParams.get("action_name");
    return HttpResponse.json({
      audit_events: actionName
        ? auditEvents.filter((row) => row.action === actionName)
        : auditEvents,
    });
  }),
  "/api/v1/admin/dashboard": http.get("*/api/v1/admin/dashboard", () =>
    HttpResponse.json(dashboardBody),
  ),
  "/api/v1/admin/prompt_templates": http.all(
    "*/api/v1/admin/prompt_templates",
    async ({ request }) => {
      if (request.method === "PATCH") {
        const body = (await request.json()) as { capability?: string; template?: string };
        const capability = body.capability ?? "bot_reply";
        promptTemplates = promptTemplates.map((row) =>
          row.capability === capability
            ? {
                ...row,
                template: body.template ?? row.template,
                overridden: true,
                version: (row.version ?? 0) + 1,
              }
            : row,
        );
        const prompt_template =
          promptTemplates.find((row) => row.capability === capability) ?? promptTemplates[0];
        return HttpResponse.json({ prompt_template });
      }
      return HttpResponse.json({ prompt_templates: promptTemplates });
    },
  ),
  "/api/v1/theme_overrides": http.get("*/api/v1/theme_overrides", () =>
    HttpResponse.json(themePalette),
  ),
  "/api/v1/calls": http.post("*/api/v1/calls", async ({ request }) => {
    const body = (await request.json()) as { conversation_id?: number; kind?: string };
    const initiatorId = actorIdFromRequest(request);
    const kind = body.kind ?? "audio";
    const conversationId = body.conversation_id ?? 1;
    const envelope = callEnvelope(1, "ringing", kind, initiatorId, conversationId);
    const label = actorLabel(initiatorId);
    publishMswRealtime({
      type: "incoming_call",
      call_id: envelope.call?.id,
      conversation_id: conversationId,
      kind,
      initiator_account_id: initiatorId,
      initiator_display_name: label.name,
      initiator_username: label.username,
    });
    return HttpResponse.json(envelope, { status: 201 });
  }),
  "/api/v1/calls/active": http.get("*/api/v1/calls/active", () => HttpResponse.json({})),
  "/api/v1/calls/ice_servers": http.get("*/api/v1/calls/ice_servers", () =>
    HttpResponse.json(iceServersBody),
  ),
  "/api/v1/calls/{id}": http.get("*/api/v1/calls/:id", ({ params }) =>
    HttpResponse.json(callEnvelope(Number(params.id), "active")),
  ),
  "/api/v1/calls/{id}/accept": http.post("*/api/v1/calls/:id/accept", ({ params, request }) => {
    const id = Number(params.id);
    const accountId = actorIdFromRequest(request);
    publishMswRealtime({ type: "call_accepted", call_id: id, account_id: accountId });
    return HttpResponse.json(callEnvelope(id, "active"));
  }),
  "/api/v1/calls/{id}/cancel": http.post("*/api/v1/calls/:id/cancel", ({ params, request }) => {
    const id = Number(params.id);
    publishMswRealtime({
      type: "call_cancelled",
      call_id: id,
      account_id: actorIdFromRequest(request),
    });
    publishMswRealtime({ type: "call_missed", call_id: id });
    return HttpResponse.json(callEnvelope(id, "missed"));
  }),
  "/api/v1/calls/{id}/decline": http.post("*/api/v1/calls/:id/decline", ({ params, request }) => {
    const id = Number(params.id);
    publishMswRealtime({
      type: "call_declined",
      call_id: id,
      account_id: actorIdFromRequest(request),
    });
    return HttpResponse.json(callEnvelope(id, "declined"));
  }),
  "/api/v1/calls/{id}/hangup": http.post("*/api/v1/calls/:id/hangup", ({ params, request }) => {
    const id = Number(params.id);
    publishMswRealtime({
      type: "call_ended",
      call_id: id,
      account_id: actorIdFromRequest(request),
    });
    return HttpResponse.json(callEnvelope(id, "ended"));
  }),
  "/api/v1/calls/{id}/screen_share": http.post(
    "*/api/v1/calls/:id/screen_share",
    async ({ params, request }) => {
      const id = Number(params.id);
      const body = (await request.json()) as { sharing?: boolean };
      const sharing = body.sharing === true;
      publishMswRealtime({
        type: "screen_share",
        call_id: id,
        account_id: actorIdFromRequest(request),
        sharing,
      });
      return HttpResponse.json(callEnvelope(id, "active"));
    },
  ),
  "/api/v1/style_profile": http.all("*/api/v1/style_profile", async ({ request }) => {
    if (request.method === "PATCH") {
      const body = (await request.json()) as { enabled?: boolean };
      styleProfileState = { ...styleProfileState, enabled: Boolean(body.enabled) };
      return HttpResponse.json(styleProfileState);
    }
    if (request.method === "POST") {
      if (!styleProfileState.enabled) {
        return HttpResponse.json(
          { error: { code: "forbidden", message: "forbidden", details: {} } },
          { status: 403 },
        );
      }
      styleProfileState = {
        ...styleProfileState,
        profile: "Casual, short sentences.",
        updated_at: MESSAGE_STAMP,
        message_count: 12,
      };
      return HttpResponse.json(styleProfileState);
    }
    return HttpResponse.json(styleProfileState);
  }),
  "/api/v1/conversations/{id}/suggest_replies": http.post(
    "*/api/v1/conversations/:id/suggest_replies",
    () => HttpResponse.json({ suggestions: ["On my way"] }),
  ),
  "/api/v1/conversations/{id}/summarize": http.post("*/api/v1/conversations/:id/summarize", () =>
    HttpResponse.json({ mode: "unread", text: "Ship Friday" }),
  ),
  "/api/v1/messages/{id}/translate": http.post("*/api/v1/messages/:id/translate", () =>
    HttpResponse.json(translationBody),
  ),
} satisfies HandlerMap;

export const handlers: HttpHandler[] = Object.values(handlerMap);
