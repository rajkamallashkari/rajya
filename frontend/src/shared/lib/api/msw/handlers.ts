import { http, HttpResponse, type HttpHandler } from "msw";
import type { paths } from "@/shared/lib/api/schema";

type HealthBody = NonNullable<
  paths["/health"]["get"]["responses"][200]["content"]
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

export const handlerMap = {
  "/health": http.get("*/health", () => HttpResponse.json(readyHealth)),
  "/up": http.get("*/up", () => new HttpResponse(null, { status: 200 })),
} satisfies HandlerMap;

export const handlers: HttpHandler[] = Object.values(handlerMap);
