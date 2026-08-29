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
  },
} satisfies SessionBody;

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
} satisfies HandlerMap;

export const handlers: HttpHandler[] = Object.values(handlerMap);
