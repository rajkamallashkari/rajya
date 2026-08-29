import { expect, test } from "@playwright/test";
import { EDGE_SWIPE_ZONE_PX } from "../src/shared/lib/navigation/constants";

test.describe("layer navigation", () => {
  test.describe("mobile stack", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("push adds history, back and edge-swipe each pop one layer, scroll is kept, buried layers stay inert", async ({
      page,
    }) => {
      await page.goto("/");
      const list = page.locator("[data-layer-scroll='base']");
      await expect(list).toBeVisible();
      const metrics = await list.evaluate((node) => {
        const el = node as HTMLElement;
        return { clientHeight: el.clientHeight, scrollHeight: el.scrollHeight };
      });
      expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

      await page.getByText("Adele Goldberg").click();
      await expect(page.locator("[data-layer-host]")).toHaveAttribute("data-stack-depth", "1");
      await expect(page.locator("[data-layer='base']")).toHaveAttribute("inert", "");
      const snapshot = Number(
        await page.locator("[data-layer='base']").getAttribute("data-layer-scroll-snapshot"),
      );
      expect(snapshot).toBeGreaterThan(0);
      const overlay = await page.evaluate(() => {
        const state = window.history.state as { __overlay?: boolean } | null;
        return state?.__overlay === true;
      });
      expect(overlay).toBe(true);

      await page.getByRole("button", { name: "Open profile" }).click();
      await expect(page.locator("[data-layer-host]")).toHaveAttribute("data-stack-depth", "2");
      await expect(page.locator("[data-layer='conversation']")).toHaveAttribute("inert", "");
      await expect(page.locator("[data-profile-panel]")).toBeVisible();

      await page.goBack();
      await expect(page.locator("[data-layer-host]")).toHaveAttribute("data-stack-depth", "1");
      await expect(page.locator("[data-conversation-thread]")).toBeVisible();
      await expect(page.locator("[data-profile-panel]")).toHaveCount(0);

      const layer = page.locator("[data-layer='conversation']");
      const box = await layer.boundingBox();
      expect(box).toBeTruthy();
      if (!box) {
        return;
      }
      await page.mouse.move(box.x + EDGE_SWIPE_ZONE_PX / 2, box.y + 80);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.6, box.y + 80, { steps: 8 });
      await page.mouse.up();
      await expect(page.locator("[data-layer-host]")).toHaveAttribute("data-stack-depth", "0");
      await expect(page.locator("[data-layer='base']")).not.toHaveAttribute("inert");
      await expect.poll(async () => list.evaluate((node) => node.scrollTop)).toBe(snapshot);
    });
  });

  test.describe("desktop panels", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("renders the same stack as side-by-side panels", async ({ page }) => {
      await page.goto("/");
      await page.getByText("Ada Lovelace").first().click();
      await expect(page.locator("[data-layer-host]")).toHaveAttribute(
        "data-presentation",
        "desktop",
      );
      await expect(page.locator("[data-layer-host]")).toHaveAttribute("data-stack-depth", "1");
      await expect(page.locator("[data-conversation-list]")).toBeVisible();
      await expect(page.locator("[data-conversation-thread]")).toBeVisible();
      await expect(page.locator("[data-layer='base']")).not.toHaveAttribute("inert");
      const handle = page.locator("[data-resize-delta]");
      const panel = page.locator("[data-layer='conversation']");
      const before = await panel.evaluate((node) => node.getBoundingClientRect().width);
      const box = await handle.boundingBox();
      expect(box).toBeTruthy();
      if (!box) {
        return;
      }
      await page.mouse.move(box.x + box.width / 2, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x + 80, box.y + 40, { steps: 8 });
      await page.mouse.up();
      const after = await panel.evaluate((node) => node.getBoundingClientRect().width);
      expect(after).toBeLessThan(before);
    });
  });
});
