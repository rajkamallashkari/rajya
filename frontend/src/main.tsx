import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "@/app/App";
import { startBrowserMocksOrPwa } from "@/shared/lib/api/msw/flag";
import { initI18n } from "@/shared/lib/i18n";
import { initErrorReporting } from "@/shared/lib/monitoring/errors";
import { startServiceWorker } from "@/shared/lib/pwa/register";
import "@/styles/index.css";

export async function mount(root: HTMLElement, mswFlag?: string): Promise<Root> {
  await startBrowserMocksOrPwa(
    mswFlag ?? import.meta.env.VITE_MSW,
    async () => {
      const { defaultStartMsw } = await import("@/shared/lib/api/msw/start-browser");
      await defaultStartMsw();
    },
    startServiceWorker,
  );
  await initI18n({
    storage: window.localStorage,
    fetcher: (url) => window.fetch(url),
  });
  await initErrorReporting();
  const reactRoot = createRoot(root);
  reactRoot.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  return reactRoot;
}

export async function bootstrap(doc: Document = document, mswFlag?: string): Promise<Root | undefined> {
  const root = doc.getElementById("root");
  if (!root) {
    return undefined;
  }
  return mount(root, mswFlag);
}

void bootstrap();
