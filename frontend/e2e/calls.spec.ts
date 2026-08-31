import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { bridgeMswBroadcast } from "./msw-broadcast";

test.describe("calls", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("A and B connect a 1:1 audio call and hang up", async ({ browser }) => {
    const { pageA, pageB, contextA, contextB } = await openCallPair(browser);
    await startVoiceFrom(pageA);
    await expect(pageB.getByRole("dialog", { name: "Incoming call" })).toBeVisible({
      timeout: 15_000,
    });
    await pageB.getByRole("button", { name: "Accept call" }).click();
    await expect(pageA.getByRole("dialog", { name: "Voice call" })).toBeVisible();
    await expect(pageB.getByRole("dialog", { name: "Voice call" })).toBeVisible();
    await pageA.getByRole("button", { name: "End call" }).click();
    await expect(pageA.getByRole("dialog", { name: "Voice call" })).toHaveCount(0);
    await expect(pageB.getByRole("dialog", { name: "Voice call" })).toHaveCount(0);
    await contextA.close();
    await contextB.close();
  });

  test("B declines an incoming call", async ({ browser }) => {
    const { pageA, pageB, contextA, contextB } = await openCallPair(browser);
    await startVoiceFrom(pageA);
    await expect(pageB.getByRole("dialog", { name: "Incoming call" })).toBeVisible({
      timeout: 15_000,
    });
    await pageB.getByRole("button", { name: "Decline call" }).click();
    await expect(pageB.getByRole("dialog", { name: "Incoming call" })).toHaveCount(0);
    await expect(pageA.getByRole("dialog", { name: "Voice call" })).toHaveCount(0);
    await contextA.close();
    await contextB.close();
  });

  test("an unanswered ring times out", async ({ browser }) => {
    const { pageA, pageB, contextA, contextB } = await openCallPair(browser);
    await pageB.clock.install();
    await startVoiceFrom(pageA);
    await expect(pageB.getByRole("dialog", { name: "Incoming call" })).toBeVisible({
      timeout: 15_000,
    });
    await pageB.clock.fastForward(45_000);
    await expect(pageB.getByRole("dialog", { name: "Incoming call" })).toHaveCount(0);
    await expect(pageA.getByRole("dialog", { name: "Voice call" })).toHaveCount(0);
    await contextA.close();
    await contextB.close();
  });

  test("starts and stops a screen share without dropping the call", async ({ browser }) => {
    const { pageA, pageB, contextA, contextB } = await openCallPair(browser);
    await startVoiceFrom(pageA);
    await expect(pageB.getByRole("dialog", { name: "Incoming call" })).toBeVisible({
      timeout: 15_000,
    });
    await pageB.getByRole("button", { name: "Accept call" }).click();
    await expect(pageA.getByRole("dialog", { name: "Voice call" })).toBeVisible();
    await pageA.getByRole("button", { name: "Share screen" }).click();
    await expect(pageA.getByRole("button", { name: "Stop sharing screen" })).toBeVisible();
    await pageA.getByRole("button", { name: "Stop sharing screen" }).click();
    await expect(pageA.getByRole("button", { name: "Share screen" })).toBeVisible();
    await expect(pageA.getByRole("dialog", { name: "Voice call" })).toBeVisible();
    await expect(pageB.getByRole("dialog", { name: "Voice call" })).toBeVisible();
    await pageA.getByRole("button", { name: "End call" }).click();
    await contextA.close();
    await contextB.close();
  });
});

async function stubDisplayCapture(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const proto = navigator.mediaDevices;
    proto.getDisplayMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillRect(0, 0, 32, 32);
      }
      return canvas.captureStream(5);
    };
  });
}

async function openCallPair(browser: Browser) {
  const contextA = await browser.newContext({ permissions: ["camera", "microphone"] });
  const contextB = await browser.newContext({ permissions: ["camera", "microphone"] });
  await bridgeMswBroadcast(contextA, contextB);
  await stubDisplayCapture(contextA);
  await stubDisplayCapture(contextB);
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await openSeededThread(pageA, "Use account A");
  await openSeededThread(pageB, "Use account B");
  await expect(pageA.getByRole("button", { name: "Start voice call" })).toBeVisible();
  await expect(pageB.getByRole("button", { name: "Start voice call" })).toBeVisible();
  return { contextA, contextB, pageA, pageB };
}

async function openSeededThread(page: Page, seedName: string) {
  await page.goto("/dev/accounts");
  await page.getByRole("button", { name: seedName }).click();
  await page.goto("/");
  const thread = page.locator("[data-conversation-thread]");
  await expect(thread).toBeVisible();
  await thread.getByLabel("Type a message").waitFor();
  return thread;
}

async function startVoiceFrom(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Start voice call" }).click();
  await expect(page.getByRole("dialog", { name: "Voice call" })).toBeVisible();
}
