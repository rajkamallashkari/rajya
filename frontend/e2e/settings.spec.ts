import { expect, test } from "@playwright/test";

test("applies theme, wallpaper, and typography sliders live from settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  const panel = page.locator("[data-settings-panel]");
  await expect(panel).toBeVisible();

  await panel.getByRole("button", { name: "Dark" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(
    true,
  );

  await panel.getByRole("button", { name: "Dusk" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.wallpaper)).toBe("dusk");

  await panel.getByRole("slider", { name: "Text size" }).focus();
  await page.keyboard.press("End");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--app-size-multiplier")))
    .toBe("1.3");

  await panel.getByRole("slider", { name: "Text weight" }).focus();
  await page.keyboard.press("End");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--app-font-weight")))
    .toBe("700");

  await panel.getByRole("slider", { name: "Line height" }).focus();
  await page.keyboard.press("End");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--app-line-height")))
    .toBe("1.9");

  await panel.getByRole("slider", { name: "Letter spacing" }).focus();
  await page.keyboard.press("End");
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.style.getPropertyValue("--app-letter-spacing")),
    )
    .toBe("0.04em");
});
