import { describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@sentry/react", () => sentry);

import { initErrorReporting, reportError, setErrorSink } from "./errors";

describe("error reporting", () => {
  it("forwards to the sink and no-ops without one", async () => {
    const seen: unknown[] = [];
    setErrorSink((error, context) => {
      seen.push([error, context]);
    });
    reportError("boom", { level: "app" });
    expect(seen).toEqual([["boom", { level: "app" }]]);
    setErrorSink(null);
    expect(() => reportError("ignored")).not.toThrow();
    await initErrorReporting(undefined);
    expect(() => reportError("still-ignored")).not.toThrow();
  });

  it("initializes Sentry when a DSN is provided", async () => {
    await initErrorReporting("https://public@example/1");
    expect(sentry.init).toHaveBeenCalledWith({
      dsn: "https://public@example/1",
      sendDefaultPii: false,
    });
    reportError("sentry-boom", { path: "/" });
    expect(sentry.captureException).toHaveBeenCalledWith("sentry-boom", { extra: { path: "/" } });
    const captureException = vi.fn();
    await initErrorReporting("https://public@example/2", async () => ({
      init: vi.fn(),
      captureException,
    }));
    reportError("custom");
    expect(captureException).toHaveBeenCalledWith("custom", { extra: undefined });
    setErrorSink(null);
  });
});
