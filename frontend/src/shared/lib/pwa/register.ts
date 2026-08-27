export async function registerServiceWorker(
  registrar: Pick<Navigator, "serviceWorker"> | undefined = navigator,
): Promise<ServiceWorkerRegistration | null> {
  if (!registrar?.serviceWorker) {
    return null;
  }
  return registrar.serviceWorker.register("/sw.js");
}
