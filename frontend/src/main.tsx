import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { initI18n } from "@/shared/lib/i18n";
import { registerServiceWorker } from "@/shared/lib/pwa/register";
import "@/styles/index.css";

export async function mount(root: HTMLElement): Promise<void> {
  await initI18n({
    storage: window.localStorage,
    fetcher: (url) => window.fetch(url),
  });
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await registerServiceWorker();
}

export async function bootstrap(doc: Document = document): Promise<void> {
  const root = doc.getElementById("root");
  if (!root) {
    return;
  }
  await mount(root);
}

void bootstrap();
