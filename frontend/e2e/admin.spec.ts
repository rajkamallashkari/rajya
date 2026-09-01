import { expect, test } from "@playwright/test";

test("impersonates a user, shows the banner, and exits", async ({ page }) => {
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
  await page.goto("/admin/users");
  await page.getByRole("link", { name: /Peer/ }).click();
  await page.getByRole("button", { name: "Impersonate" }).click();
  await expect(page.getByRole("alert")).toContainText("Viewing as Peer");
  await page.getByRole("button", { name: "Exit" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
