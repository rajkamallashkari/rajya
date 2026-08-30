import { expect, test } from "@playwright/test";

test.describe("media gallery", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("opens the per-chat gallery from profile", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Adele Goldberg").click();
    await page.getByRole("button", { name: "Open profile" }).click();
    await page.getByRole("button", { name: "Media, files and links" }).click();
    await expect(page.locator("[data-media-gallery]")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Media" })).toBeVisible();
  });
});
