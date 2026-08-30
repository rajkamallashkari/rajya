import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { startBrowserMocksOrPwa } from "@/shared/lib/api/msw/flag";
import { initI18n } from "@/shared/lib/i18n";
import { registerServiceWorker } from "@/shared/lib/pwa/register";
import "@/styles/index.css";

export async function mount(root: HTMLElement, mswFlag?: string): Promise<void> {
  await initI18n({
    storage: window.localStorage,
    fetcher: (url) => window.fetch(url),
  });
  await startBrowserMocksOrPwa(
    mswFlag ?? import.meta.env.VITE_MSW,
    async () => {
      const { defaultStartMsw } = await import("@/shared/lib/api/msw/start-browser");
      await defaultStartMsw();
    },
    registerServiceWorker,
  );
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

export async function bootstrap(doc: Document = document, mswFlag?: string): Promise<void> {
  const root = doc.getElementById("root");
  if (!root) {
    return;
  }
  await mount(root, mswFlag);
}

void bootstrap();
