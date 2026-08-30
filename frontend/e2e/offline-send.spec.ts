import { expect, test } from "@playwright/test";

const BODIES = ["offline-alpha", "offline-beta", "offline-gamma"] as const;

test.describe("offline outbox", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("sends three queued messages once and in order after reconnect", async ({
    context,
    page,
  }) => {
    await page.goto("/dev/accounts");
    await page.getByRole("button", { name: "Use account A" }).click();
    await page.goto("/");
    const thread = page.locator("[data-conversation-thread]");
    await expect(thread).toBeVisible();
    await thread.getByLabel("Type a message").waitFor();

    await context.setOffline(true);

    const composer = thread.getByLabel("Type a message");
    const send = thread.getByRole("button", { name: "Send" });
    for (const body of BODIES) {
      await composer.fill(body);
      await send.click();
      const bubble = thread.locator("[data-message-bubble]", { hasText: body });
      await expect(bubble).toHaveCount(1);
      await expect(bubble).toHaveAttribute("data-status", "queued");
    }

    await context.setOffline(false);
    await page.evaluate(async () => {
      await window.__rajyaDrainOutbox?.();
    });

    for (const body of BODIES) {
      const bubble = thread.locator("[data-message-bubble]", { hasText: body });
      await expect(bubble).toHaveCount(1);
      await expect(bubble).not.toHaveAttribute("data-status", "queued");
    }
    const bubbleBodies = await thread.locator("[data-message-bubble]").evaluateAll((nodes) =>
      nodes.map((node) => node.textContent ?? ""),
    );
    const positions = BODIES.map((body) => bubbleBodies.findIndex((text) => text.includes(body)));
    expect(positions[0]).toBeGreaterThanOrEqual(0);
    expect(positions[0]).toBeLessThan(positions[1] ?? -1);
    expect(positions[1]).toBeLessThan(positions[2] ?? -1);
  });

  test("tab drain and simulated service-worker drain create one row (F-3)", async ({
    context,
    page,
  }) => {
    await page.goto("/dev/accounts");
    await page.getByRole("button", { name: "Use account A" }).click();
    await page.goto("/");
    const thread = page.locator("[data-conversation-thread]");
    await expect(thread).toBeVisible();

    await context.setOffline(true);
    await thread.getByLabel("Type a message").fill("dual-drain-once");
    await thread.getByRole("button", { name: "Send" }).click();
    const bubble = thread.locator("[data-message-bubble]", { hasText: "dual-drain-once" });
    await expect(bubble).toHaveCount(1);
    await expect(bubble).toHaveAttribute("data-status", "queued");

    await context.setOffline(false);
    await page.evaluate(async () => {
      await window.__rajyaDualDrainOutbox?.();
    });
    await expect(bubble).toHaveCount(1);
    await expect(bubble).not.toHaveAttribute("data-status", "queued");
  });
});
