import { describe, expect, it } from "vitest";
import {
  adminLazy,
  lazyAdmin,
  loadAdminTree,
  loadAccountsPage,
  loadBotBuilderForm,
  loadCallOverlays,
  loadGalleryPage,
  loadLocationMap,
  loadPickerSheet,
  loadSettingsPanel,
} from "./chunks";

describe("code-split chunks", () => {
  it("loads the deferred feature modules", async () => {
    await expect(loadSettingsPanel()).resolves.toMatchObject({ SettingsPanel: expect.any(Function) });
    await expect(loadAdminTree()).resolves.toMatchObject({ AdminRoute: expect.any(Function) });
    await expect(loadCallOverlays()).resolves.toMatchObject({ CallOverlays: expect.any(Function) });
    await expect(loadBotBuilderForm()).resolves.toMatchObject({ BotBuilderForm: expect.any(Function) });
    await expect(loadPickerSheet()).resolves.toMatchObject({ PickerSheet: expect.any(Function) });
    await expect(loadLocationMap()).resolves.toMatchObject({ LocationMap: expect.any(Function) });
    await expect(loadGalleryPage()).resolves.toMatchObject({ GalleryPage: expect.any(Function) });
    await expect(loadAccountsPage()).resolves.toMatchObject({ AccountsDevPage: expect.any(Function) });
    const route = await adminLazy("AdminRoute")();
    expect(typeof route.Component).toBe("function");
    expect(typeof lazyAdmin("AdminDashboardPanel")).toBe("object");
  });
});
