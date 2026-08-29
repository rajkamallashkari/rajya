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
  user: { id: 1, email: "ada@example.com", onboarded: false },
} satisfies SessionBody;

const accepted = { accepted: true } satisfies AcceptedBody;

const sessionResponse = () => HttpResponse.json(session);
const acceptedResponse = () => HttpResponse.json(accepted);

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
} satisfies HandlerMap;

export const handlers: HttpHandler[] = Object.values(handlerMap);
