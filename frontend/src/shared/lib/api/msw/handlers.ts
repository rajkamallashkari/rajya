import { http, HttpResponse, type HttpHandler } from "msw";
import type { paths } from "@/shared/lib/api/schema";

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
} satisfies HandlerMap;

export const handlers: HttpHandler[] = Object.values(handlerMap);
