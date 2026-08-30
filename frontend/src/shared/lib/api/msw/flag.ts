export function shouldStartMsw(flag: string | undefined): boolean {
  return flag === "1" || flag === "true";
}

export async function startBrowserMocksOrPwa(
  flag: string | undefined,
  startMsw: () => Promise<void>,
  startPwa: () => Promise<unknown>,
): Promise<void> {
  if (shouldStartMsw(flag)) {
    await startMsw();
    return;
  }
  await startPwa();
}
