import { createRequire } from "node:module";
import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { bridgeMswBroadcast } from "./msw-broadcast";

const en = createRequire(import.meta.url)(
  "../src/shared/lib/i18n/en.json",
) as typeof import("../src/shared/lib/i18n/en.json");

test.describe("polish regressions", () => {
  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("sends a voice note into an optimistic bubble", async ({ page }) => {
      await openSeededThread(page);
      await page.getByRole("button", { name: en.composer.mic }).click();
      await page.getByRole("button", { name: en.composer.send_voice }).click();
      await expect(page.locator("[data-voice-note]")).toBeVisible();
    });

    test("opens Jump to date from a thread date chip", async ({ page }) => {
      await openSeededThread(page);
      await page.locator("[data-date-divider] button").first().click();
      await expect(page.getByRole("heading", { name: en.search.jump_date })).toBeVisible();
      await page.getByRole("button", { name: en.search.jump_today }).click();
      await expect(page.locator("[data-conversation-thread]")).toBeVisible();
    });
  });

  test("blocks from profile, then unblocks without 404ing the blocker", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Adele Goldberg").click();
    await page.getByRole("button", { name: en.shell.open_profile }).click();
    await expect(page.locator("[data-profile-panel]")).toBeVisible();
    await page.getByRole("button", { name: en.auth.profile.block }).click();
    await expect(page.getByRole("button", { name: en.auth.profile.unblock })).toBeVisible();
    await expect(page.getByText(en.auth.profile.blocked)).toBeVisible();
    await page.getByRole("button", { name: en.auth.profile.unblock }).click();
    await expect(page.getByRole("button", { name: en.auth.profile.block })).toBeVisible();
    await expect(page.locator("[data-profile-panel]")).toBeVisible();
  });

  test("renders a decodable share QR in the production bundle", async ({ page }) => {
    const crashes: string[] = [];
    page.on("pageerror", (error) => crashes.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /hook|react/i.test(message.text())) {
        crashes.push(message.text());
      }
    });
    await page.goto("/");
    await page.getByRole("button", { name: en.shell.profile }).click();
    await page.getByRole("button", { name: en.auth.profile.share }).click();
    const qr = page.getByRole("img", { name: en.qr.image });
    await expect(qr).toBeVisible();
    await expect(qr).toHaveAttribute("src", /^data:image\/svg\+xml/);
    const decoded = await qr.evaluate((node: HTMLImageElement) => ({
      complete: node.complete,
      width: node.naturalWidth,
    }));
    expect(decoded.complete).toBe(true);
    expect(decoded.width).toBeGreaterThan(0);
    expect(crashes).toEqual([]);
  });

  test("checks username availability and previews an avatar in profile edit", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: en.shell.profile }).click();
    await page.getByRole("button", { name: en.auth.profile.edit }).click();
    const username = page.getByLabel(en.auth.onboarding.username);
    await username.fill("available");
    await expect(page.getByText(en.auth.profile.username_checking)).toBeVisible();
    await expect(page.getByText(en.auth.profile.username_available)).toBeVisible();
    await page
      .locator("[data-profile-edit] input[type='file']")
      .setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await expect(page.getByRole("button", { name: en.auth.profile.avatar_cancel })).toBeVisible();
  });

  test("reloading an active call offers Return to call or hangs up without a stuck End bar", async ({
    browser,
  }) => {
    const { pageA, pageB, contextA, contextB } = await openCallPair(browser);
    await startVoiceFrom(pageA);
    await expect(pageB.getByRole("dialog", { name: en.calls.incoming })).toBeVisible({
      timeout: 15_000,
    });
    await pageB.getByRole("button", { name: en.calls.accept }).click();
    await expect(pageA.getByRole("dialog", { name: en.calls.title_audio })).toBeVisible();
    await pageA.reload();
    await expect(pageA.getByRole("navigation", { name: en.shell.tabs_aria })).toBeVisible();
    const returnButton = pageA.getByRole("button", { name: en.calls.return_to_call });
    const liveCall = pageA.getByRole("dialog", { name: en.calls.title_audio });
    if (await returnButton.isVisible()) {
      await returnButton.click();
      await expect(liveCall).toBeVisible();
    } else {
      await expect(liveCall).toHaveCount(0);
      await expect(pageA.getByRole("button", { name: en.calls.end })).toHaveCount(0);
    }
    await contextA.close();
    await contextB.close();
  });
});

async function openSeededThread(page: Page) {
  await page.goto("/");
  await page.getByText("Adele Goldberg").click();
  const thread = page.locator("[data-conversation-thread]");
  await expect(thread).toBeVisible();
  await thread.getByLabel(en.composer.placeholder).waitFor();
  return thread;
}

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
  await openDevThread(pageA, "Use account A");
  await openDevThread(pageB, "Use account B");
  await expect(pageA.getByRole("button", { name: en.calls.start_audio })).toBeVisible();
  await expect(pageB.getByRole("button", { name: en.calls.start_audio })).toBeVisible();
  return { contextA, contextB, pageA, pageB };
}

async function openDevThread(page: Page, seedName: string) {
  await page.goto("/dev/accounts");
  await page.getByRole("button", { name: seedName }).click();
  await page.goto("/");
  const thread = page.locator("[data-conversation-thread]");
  await expect(thread).toBeVisible();
  await thread.getByLabel(en.composer.placeholder).waitFor();
  return thread;
}

async function startVoiceFrom(page: Page): Promise<void> {
  await page.getByRole("button", { name: en.calls.start_audio }).click();
  await expect(page.getByRole("dialog", { name: en.calls.title_audio })).toBeVisible();
}
