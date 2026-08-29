import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/messages/model/highlight", () => ({
  highlightCode: vi.fn().mockResolvedValue(null),
}));

import {
  GALLERY_SECTION_KEYS,
  GalleryPage,
  galleryAction,
  galleryAsyncAction,
} from "@/app/dev/gallery-page";
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
    await user.click(screen.getByRole("button", { name: en.composer.dismiss_reply }));
    const bubbles = document.querySelectorAll("[data-message-bubble]");
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    expect(document.querySelector("[data-message-menu]")).not.toBeNull();
    await user.click(document.querySelector(".ui-scrim") as HTMLElement);
    galleryAction();
    await galleryAsyncAction();
    const firstComposer = document.querySelector("[data-composer]") as HTMLElement;
    const composer = within(firstComposer);
    expect(firstComposer).toHaveAttribute("data-composer-row", "compose");
    expect(composer.queryByRole("button", { name: en.composer.emoji })).toBeNull();
    expect(composer.queryByRole("button", { name: en.composer.attach })).toBeNull();
    expect(composer.getByRole("button", { name: en.composer.mic })).toBeInTheDocument();
    expect(composer.getByRole("button", { name: en.composer.send })).toHaveAttribute(
      "data-composer-primary",
      "send",
    );
    await user.click(
      composer.getByRole("button", {
        name: en.composer.scheduled.replace("{{when}}", en.gallery.composer.schedule),
      }),
    );
    await user.click(composer.getByRole("button", { name: en.composer.clear_schedule }));
    await user.click(
      composer.getByRole("button", {
        name: en.composer.remove_attachment.replace("{{name}}", en.gallery.composer.attachment),
      }),
    );
    fireEvent.contextMenu(composer.getByRole("button", { name: en.composer.send }));
    await user.click(screen.getByRole("menuitem", { name: en.composer.attach_files }));
    fireEvent.contextMenu(composer.getByRole("button", { name: en.composer.send }));
    await user.click(screen.getByRole("menuitem", { name: en.composer.schedule }));
    fireEvent.contextMenu(composer.getByRole("button", { name: en.composer.send }));
    await user.click(screen.getByRole("menuitem", { name: en.composer.rewrite }));
    await user.type(composer.getByRole("textbox"), "hi");
    await user.click(composer.getByRole("button", { name: en.composer.send }));
    await user.click(screen.getByRole("button", { name: en.composer.dismiss_edit }));
    await user.click(screen.getByRole("button", { name: en.composer.pause_voice }));
    await user.click(screen.getByRole("button", { name: en.composer.preview_voice }));
    await user.click(screen.getByRole("button", { name: en.layers.push_demo }));
    await user.click(screen.getByRole("button", { name: en.shell.open_profile }));
    await user.click(screen.getByRole("button", { name: en.impersonation.exit }));
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
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
