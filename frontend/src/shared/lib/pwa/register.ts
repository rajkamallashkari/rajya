export async function clearServiceWorkers(
  registrar: Pick<Navigator, "serviceWorker"> | undefined = navigator,
): Promise<void> {
  const serviceWorker = registrar?.serviceWorker;
  if (!serviceWorker?.getRegistrations) {
    return;
  }
  const registrations = await serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

export async function registerServiceWorker(
  registrar: Pick<Navigator, "serviceWorker"> | undefined = navigator,
): Promise<ServiceWorkerRegistration | null> {
  if (!registrar?.serviceWorker) {
    return null;
  }
  try {
    return await registrar.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function startServiceWorker(
  registrar: Pick<Navigator, "serviceWorker"> | undefined = navigator,
  production: boolean = import.meta.env.PROD,
): Promise<ServiceWorkerRegistration | null> {
  if (!production) {
    await clearServiceWorkers(registrar);
    return null;
  }
  return registerServiceWorker(registrar);
}
