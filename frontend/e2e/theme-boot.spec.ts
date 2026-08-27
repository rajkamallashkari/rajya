import { expect, test } from "@playwright/test";

const cache = {
  theme: "dark",
  accentHex: "#4F46E5",
  userSetsAccent: true,
  sliders: { size: 0, weight: 0, lineHeight: 0, letterSpacing: 0 },
  density: "comfortable",
  adminOverrides: {},
};

test("applies the cached dark theme before paint", async ({ page }) => {
  await page.addInitScript((payload) => {
    localStorage.setItem("rajya:theme-cache", JSON.stringify(payload));
  }, cache);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  expect(isDark).toBe(true);
});

test("applies a cached light theme without a dark class", async ({ page }) => {
  await page.addInitScript((payload) => {
    localStorage.setItem("rajya:theme-cache", JSON.stringify({ ...payload, theme: "light" }));
  }, cache);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  expect(isDark).toBe(false);
});
