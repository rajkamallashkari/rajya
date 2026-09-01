export interface ErrorReporterModule {
  init: (options: { dsn: string; sendDefaultPii: boolean }) => void;
  captureException: (error: unknown, hint?: { extra?: Record<string, unknown> }) => void;
}

let sink: ((error: unknown, context?: Record<string, unknown>) => void) | null = null;

export function setErrorSink(
  next: ((error: unknown, context?: Record<string, unknown>) => void) | null,
): void {
  sink = next;
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  sink?.(error, context);
}

export async function initErrorReporting(
  dsn: string | undefined = import.meta.env.VITE_SENTRY_DSN,
  load: () => Promise<ErrorReporterModule> = () => import("@sentry/react"),
): Promise<void> {
  if (!dsn) {
    setErrorSink(null);
    return;
  }
  const Sentry = await load();
  Sentry.init({ dsn, sendDefaultPii: false });
  setErrorSink((error, context) => {
    Sentry.captureException(error, { extra: context });
  });
}
