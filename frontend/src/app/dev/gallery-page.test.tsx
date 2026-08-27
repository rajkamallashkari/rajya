import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/messages/model/highlight", () => ({
  highlightCode: vi.fn().mockResolvedValue(null),
}));

import { GALLERY_SECTION_KEYS, GalleryPage } from "@/app/dev/gallery-page";
import { AppProviders } from "@/app/providers";
import { appRoutes, createRouter } from "@/app/router";
import { en } from "@/shared/lib/i18n/catalog";

describe("GalleryPage", () => {
  it("renders every primitive section and switches theme and density", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <GalleryPage />
      </AppProviders>,
    );
    expect(screen.getByRole("heading", { name: en.gallery.title })).toBeInTheDocument();
    for (const key of GALLERY_SECTION_KEYS) {
      expect(screen.getByRole("heading", { name: en.gallery.sections[key] })).toBeInTheDocument();
    }
    expect(document.querySelector("[data-combination='light-comfortable']")).not.toBeNull();
    expect(document.querySelector("[data-combination='dark-compact']")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.gallery.theme.dark }));
    expect(document.querySelector("[data-theme-preference='dark']")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.gallery.theme.light }));
    await user.click(screen.getByRole("button", { name: en.gallery.density.compact }));
    expect(document.querySelector("[data-density='compact']")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.gallery.density.comfortable }));
    await user.click(screen.getByRole("button", { name: en.gallery.theme.system }));
    expect(document.querySelector("[data-theme-preference='system']")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.gallery.toast.trigger }));
    expect(await screen.findByText(en.gallery.toast.title)).toBeInTheDocument();
  });
});

describe("gallery route", () => {
  it("is registered on the app router", () => {
    expect(createRouter()).toBeTruthy();
    expect(appRoutes.some((route) => route.path === "/dev/gallery")).toBe(true);
  });

  it("renders the gallery at /dev/gallery", () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/dev/gallery"] });
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    expect(screen.getByRole("heading", { name: en.gallery.title })).toBeInTheDocument();
  });
});
