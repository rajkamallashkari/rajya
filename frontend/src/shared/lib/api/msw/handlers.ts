import { http, HttpResponse, type HttpHandler } from "msw";
import type { paths } from "@/shared/lib/api/schema";
import {
  appendSent,
  findConversation,
  findMessage,
  infoFor,
  MESSAGE_STAMP,
  messagingStore,
  pageFor,
  patchMessage,
  reactStoredMessage,
  setConversationTicks,
  tombstoneMessage,
  voteStoredPoll,
  closeStoredPoll,
  findPoll,
  VIEWER,
} from "./messaging-store";
import { publishMswRealtime } from "@/shared/lib/realtime/msw-bridge";

type HealthBody = NonNullable<
  paths["/health"]["get"]["responses"][200]["content"]
>["application/json"];

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
  ],
} satisfies DeviceSessionListBody;
const contactNickname = {
  nickname: "Ada",
  account: session.account,
} satisfies ContactNicknameBody;
const contactNicknameList = { nicknames: [contactNickname] } satisfies ContactNicknameListBody;
const meResponse = () => HttpResponse.json(me);

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
const messageReminder = {
  id: 1,
  message_id: 101,
  remind_at: MESSAGE_STAMP,
  note: "Ping",
  completed_at: null,
  created_at: MESSAGE_STAMP,
};

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
    return meResponse();
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
  "/api/v1/accounts/{id}": http.get("*/api/v1/accounts/:id", () =>
    HttpResponse.json(session.account),
  ),
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
    return HttpResponse.json({ conversations: messagingStore().conversations });
  }),
  "/api/v1/conversations/{id}": http.all("*/api/v1/conversations/:id", ({ params }) => {
    const conversation = findConversation(Number(params.id));
    if (!conversation) {
      return jsonError(404);
    }
    conversation.manually_unread_at = null;
    return HttpResponse.json(conversation);
  }),
  "/api/v1/conversations/{id}/pin": http.all("*/api/v1/conversations/:id/pin", ({ params, request }) => {
    const conversation = findConversation(Number(params.id));
    if (!conversation) {
      return jsonError(404);
    }
    conversation.pinned_at = request.method === "DELETE" ? null : MESSAGE_STAMP;
    return HttpResponse.json(conversation);
  }),
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
  "/api/v1/conversations/{id}/leave": http.post("*/api/v1/conversations/:id/leave", ({ params }) => {
    const conversation = findConversation(Number(params.id));
    if (!conversation) {
      return jsonError(404);
    }
    return okResponse();
  }),
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
  "/api/v1/messages/bulk_unsend": http.post("*/api/v1/messages/bulk_unsend", async ({ request }) => {
    const body = (await request.json()) as { message_ids?: number[] };
    const messages = (body.message_ids ?? [])
      .map((id) => tombstoneMessage(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
    return HttpResponse.json({ messages });
  }),
  "/api/v1/messages/bulk_forward": http.post("*/api/v1/messages/bulk_forward", async ({ request }) => {
    const body = (await request.json()) as { conversation_id?: number; message_ids?: number[] };
    const messages = (body.message_ids ?? []).map((id) => {
      const source = findMessage(id);
      return appendSent(body.conversation_id ?? 1, source?.body ?? "", undefined);
    });
    return HttpResponse.json({ messages }, { status: 201 });
  }),
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
} satisfies HandlerMap;

export const handlers: HttpHandler[] = Object.values(handlerMap);
