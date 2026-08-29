import { expect, test } from "@playwright/test";

test("multi-account outbox isolation", async ({ page }) => {
  await page.goto("/dev/accounts");
  await page.getByRole("button", { name: "Use account A" }).click();
  await page.getByRole("button", { name: "Queue outbox" }).click();
  await expect(page.locator("[data-outbox-count]")).toHaveAttribute("data-outbox-count", "1");
  await page.getByRole("button", { name: "Use account B" }).click();
  await expect(page.locator("[data-outbox-count]")).toHaveAttribute("data-outbox-count", "0");
  await page.getByRole("button", { name: "Switch to Use account A" }).click();
  await expect(page.locator("[data-outbox-count]")).toHaveAttribute("data-outbox-count", "1");
});
