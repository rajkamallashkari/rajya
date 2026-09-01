import { expect, test } from "@playwright/test";

test("serves an installable Rajya PWA manifest and title", async ({ page, request }) => {
  const manifest = await request.get("/manifest.json");
  expect(manifest.ok()).toBe(true);
  const body = (await manifest.json()) as { name: string; short_name: string };
  expect(body.name).toBe("Rajya");
  expect(body.short_name).toBe("Rajya");
  await page.goto("/");
  await expect(page).toHaveTitle("Rajya");
});
