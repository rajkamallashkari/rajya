import { expect, test } from "@playwright/test";

test.describe("search jump restore", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("scroll deep, search, jump, back restores scroll (P8 DoD)", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Adele Goldberg").click();
    const scroller = page.locator("[data-conversation-thread] [data-layer-scroll]");
    await expect(scroller).toBeVisible();
    await scroller.evaluate((node) => {
      node.scrollTop = 80;
    });
    const original = await scroller.evaluate((node) => node.scrollTop);
    await page.getByRole("button", { name: "Search messages" }).click();
    await page.getByLabel("Search in conversation").fill("memento");
    await expect(page.locator("[data-message-id]").filter({ hasText: "memento" })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Back" }).click();
    await expect.poll(async () => scroller.evaluate((node) => node.scrollTop)).toBe(original);
  });
});
