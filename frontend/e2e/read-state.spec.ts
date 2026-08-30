import { createRequire } from "node:module";
import { expect, test, type Page } from "@playwright/test";
import { bridgeMswBroadcast } from "./msw-broadcast";

const registry = createRequire(import.meta.url)("../src/shared/lib/config/settings-registry.json") as {
  typing_throttle: { default: number };
};
const TYPING_THROTTLE_MS = registry.typing_throttle.default * 1000;

test.describe("live read state", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("A sees accent ticks, B sees typing, and a system line appears", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    await bridgeMswBroadcast(contextA, contextB);
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const threadA = await openSeededThread(pageA, "Use account A");
    const threadB = await openSeededThread(pageB, "Use account B");

    await threadA.getByLabel("Type a message").fill("hello-ticks");
    await threadA.getByRole("button", { name: "Send" }).click();
    const sent = threadA.locator("[data-message-bubble]", { hasText: "hello-ticks" });
    await expect(sent).toHaveCount(1);
    await expect(sent).not.toHaveAttribute("data-status", "queued");

    await expect(threadB.locator("[data-message-bubble]", { hasText: "hello-ticks" })).toHaveCount(1);
    await expect(sent).toHaveAttribute("data-status", "read");

    await pageA.waitForTimeout(TYPING_THROTTLE_MS + 50);
    await threadA.getByLabel("Type a message").fill("typing now");
    await expect(threadB.locator("[data-typing-bubble]")).toBeVisible();

    await pageB.evaluate(() => {
      window.__rajyaWriteSystemEvent?.(1, "member_left", "Grace left");
    });
    await expect(threadA.locator("[data-system-message='member_left']")).toHaveText("Grace left");

    await contextA.close();
    await contextB.close();
  });
});

async function openSeededThread(page: Page, seedName: string) {
  await page.goto("/dev/accounts");
  await page.getByRole("button", { name: seedName }).click();
  await page.goto("/");
  const thread = page.locator("[data-conversation-thread]");
  await expect(thread).toBeVisible();
  await thread.getByLabel("Type a message").waitFor();
  return thread;
}
