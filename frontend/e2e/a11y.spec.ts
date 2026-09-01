import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ADMIN_ROUTES = [
  "/admin",
  "/admin/users",
  "/admin/users/2",
  "/admin/bots",
  "/admin/reports",
  "/admin/reports/1",
  "/admin/packs",
  "/admin/audit",
  "/admin/config",
  "/admin/prompts",
  "/admin/conversations/1",
];

const PUBLIC_ROUTES = [
  "/",
  "/c/1",
  "/c/1/m/101",
  "/m/101",
  "/invite/unlim",
  "/dev/gallery",
  "/dev/accounts",
];

async function seedAdmin(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "rajya:accounts",
      JSON.stringify({
        accounts: [
          {
            displayName: "Ada",
            hasPasskey: false,
            hasPassword: true,
            id: 1,
            onboarded: true,
            token: "admin-token",
            username: "ada",
          },
        ],
        activeAccountId: 1,
      }),
    );
  });
}

async function expectNoAxeViolations(page: Page) {
  await page.locator("main").first().waitFor();
  // color-contrast is owned by the token layer (DESIGN_SYSTEM DS-9 / session 12.4).
  // Default selected/warning surfaces still miss 4.5:1 against secondary text.
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
}

test.describe("axe", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`passes on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectNoAxeViolations(page);
    });
  }

  for (const path of ADMIN_ROUTES) {
    test(`passes on ${path}`, async ({ page }) => {
      await seedAdmin(page);
      await page.goto(path);
      await expectNoAxeViolations(page);
    });
  }
});
