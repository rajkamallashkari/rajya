import { createRequire } from "node:module";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { SIGN_IN_QUERY } from "../src/features/auth/model/session-gate";
import { bridgeMswBroadcast } from "./msw-broadcast";

const en = createRequire(import.meta.url)(
  "../src/shared/lib/i18n/en.json",
) as typeof import("../src/shared/lib/i18n/en.json");
const registry = createRequire(import.meta.url)(
  "../src/shared/lib/config/settings-registry.json",
) as { search_debounce: { default: number } };
const SEARCH_DEBOUNCE_MS = registry.search_debounce.default;

const PASSWORD = "password12";
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";

test.describe("shell chrome", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("two signed-in humans start a DM from compose", async ({ browser }) => {
    const { pageA, pageB, contextA, contextB } = await openSignedInPair(browser);
    await pageA.getByRole("button", { name: en.compose.new_conversation }).click();
    await pageA.getByRole("menuitem", { name: en.compose.message }).click();
    await pageA.getByLabel(en.compose.search).fill("@grace");
    await pageA.waitForTimeout(SEARCH_DEBOUNCE_MS + 50);
    await pageA.getByRole("button", { name: /@grace/ }).click();
    const threadA = pageA.locator("[data-conversation-thread]");
    await expect(threadA).toBeVisible();
    await threadA.getByLabel(en.composer.placeholder).fill("hello-from-ada");
    await threadA.getByRole("button", { name: en.composer.send }).click();
    await expect(pageA.locator("[data-message-bubble]", { hasText: "hello-from-ada" })).toHaveCount(
      1,
    );
    await expect(pageB.locator("[data-message-bubble]", { hasText: "hello-from-ada" })).toHaveCount(
      1,
    );
    await contextA.close();
    await contextB.close();
  });

  test("keeps destinations exclusive and pops an overlay with back", async ({ page }) => {
    await signInWithPassword(page, "ada@example.com", PASSWORD);
    await page.getByRole("button", { name: en.shell.calls }).click();
    await expect(page.getByRole("region", { name: en.shell.calls })).toBeVisible();
    await expect(page.locator("[data-conversation-list]")).toHaveCount(0);
    await expect(page.getByRole("region", { name: en.shell.profile })).toHaveCount(0);
    await page.getByRole("button", { name: en.shell.profile }).click();
    await expect(page.getByRole("region", { name: en.shell.profile })).toBeVisible();
    await expect(page.getByRole("region", { name: en.shell.calls })).toHaveCount(0);
    await expect(page.locator("[data-conversation-list]")).toHaveCount(0);
    await page.getByRole("button", { name: en.shell.chats }).click();
    await expect(page.locator("[data-conversation-list]")).toBeVisible();
    await expect(page.locator("[data-conversation-thread]")).toBeVisible();
    await page.getByRole("button", { name: en.shell.open_profile }).click();
    await expect(page.locator("[data-layer-column='overlay']")).toBeVisible();
    await page.getByRole("button", { name: en.shell.back }).click();
    await expect(page.locator("[data-profile-panel]")).toHaveCount(0);
    await expect(page.locator("[data-conversation-thread]")).toBeVisible();
  });

  test("signs in with Google GIS when a client id is configured", async ({ page }) => {
    test.skip(googleClientId.length === 0, "Google client id is not in the environment");
    await page.addInitScript(() => {
      Object.assign(window, {
        google: {
          accounts: {
            oauth2: {
              initCodeClient: (config: { callback: (response: { code?: string }) => void }) => ({
                requestCode: () => config.callback({ code: "gis-e2e" }),
              }),
            },
          },
        },
      });
    });
    await page.goto(`/?${SIGN_IN_QUERY}=1`);
    await expect(page.getByRole("button", { name: en.auth.gate.google })).toBeVisible();
    await page.getByRole("button", { name: en.auth.gate.google }).click();
    await expect(page.getByRole("dialog", { name: en.auth.gate.aria })).toHaveCount(0);
    await expect(page.locator("[data-conversation-list]")).toBeVisible();
  });
});

test.describe("shell chrome on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("hides the tab bar while a nested chat is open", async ({ page }) => {
    await signInWithPassword(page, "ada@example.com", PASSWORD);
    await expect(page.locator("[data-primary-nav='bar']")).toBeVisible();
    await page.getByText("Adele Goldberg").click();
    await expect(page.locator("[data-conversation-thread]")).toBeVisible();
    await expect(page.locator("[data-primary-nav='bar']")).toHaveCount(0);
  });
});

async function openSignedInPair(browser: Browser) {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  await bridgeMswBroadcast(contextA, contextB);
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await signInWithPassword(pageA, "ada@example.com", PASSWORD);
  await signInWithPassword(pageB, "grace@example.com", PASSWORD);
  return { contextA, contextB, pageA, pageB };
}

async function signInWithPassword(page: Page, email: string, password: string) {
  await page.goto(`/?${SIGN_IN_QUERY}=1`);
  await expect(page.getByRole("dialog", { name: en.auth.gate.aria })).toBeVisible();
  await page.getByRole("button", { name: en.auth.gate.switch_login }).click();
  await page.getByLabel(en.auth.gate.email).fill(email);
  await page.getByLabel(en.auth.gate.password).fill(password);
  await page.getByRole("button", { name: en.auth.gate.submit_login, exact: true }).click();
  await expect(page.getByRole("dialog", { name: en.auth.gate.aria })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: en.shell.tabs_aria })).toBeVisible();
}
