import { setupWorker } from "msw/browser";
import { handlers } from "@/shared/lib/api/msw/handlers";

export async function defaultStartMsw(): Promise<void> {
  await setupWorker(...handlers).start({ onUnhandledRequest: "bypass" });
}
