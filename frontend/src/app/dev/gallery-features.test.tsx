import { type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { GalleryFeatureSections, galleryFeatureAction } from "@/app/dev/gallery-features";
import { resetOsmTileBudget } from "@/features/messages/model/osm-tiles";
import { en } from "@/shared/lib/i18n/catalog";

afterEach(() => {
  resetOsmTileBudget();
});

function Section({ sectionKey, children }: { sectionKey: string; children: ReactNode }) {
  return (
    <section>
      <h2>{sectionKey}</h2>
      {children}
    </section>
  );
}

function firstButton(name: string | RegExp): HTMLElement {
  const button = screen.getAllByRole("button", { name })[0];
  if (!button) {
    throw new Error("missing button");
  }
  return button;
}

describe("GalleryFeatureSections", () => {
  it("exercises the feature gallery interactions", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <GalleryFeatureSections Section={Section} />
      </AppProviders>,
    );
    galleryFeatureAction();
    await user.click(firstButton(/^Yes/));
    await user.click(screen.getByRole("button", { name: en.polls.results }));
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await user.click(screen.getByRole("button", { name: en.gallery.features.open_results }));
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await user.click(screen.getByRole("button", { name: en.gallery.features.open_reactions }));
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await user.click(screen.getByRole("button", { name: en.selection.clear }));
    await user.click(screen.getByRole("button", { name: en.selection.select_all }));
    await user.click(firstButton(en.selection.select_all));
    await user.click(screen.getByRole("button", { name: en.selection.copy }));
    await user.click(screen.getByRole("button", { name: en.selection.forward }));
    await user.click(screen.getByRole("button", { name: en.selection.save }));
    await user.click(screen.getByRole("button", { name: en.selection.delete }));
    await user.click(screen.getByRole("button", { name: en.gallery.features.open_picker }));
    await user.click(firstButton("👍"));
    await user.click(screen.getByRole("tab", { name: en.picker.stickers }));
    await user.click(screen.getByRole("button", { name: en.gallery.features.sticker }));
    await user.click(screen.getByRole("tab", { name: en.picker.gifs }));
    await user.click(screen.getByRole("button", { name: en.gallery.features.gif }));
    await user.click(screen.getByRole("tab", { name: en.picker.replies }));
    await user.click(
      screen.getByRole("button", { name: new RegExp(en.gallery.features.reply_shortcut, "i") }),
    );
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await user.click(screen.getByRole("button", { name: en.location.open }));
    await user.click(screen.getByRole("button", { name: en.transcript.retry }));
    await user.click(screen.getByRole("button", { name: en.contact.open_profile }));
    await user.click(screen.getByRole("button", { name: en.contact.message }));
    await user.click(screen.getByRole("option", { name: /search/i }));
    await user.click(screen.getByRole("button", { name: en.slash.empty }));
    await user.click(screen.getByRole("button", { name: en.appearance.corner.square }));
    await user.click(screen.getByRole("button", { name: en.gallery.features.open_qr }));
    await user.click(screen.getByRole("button", { name: en.qr.copy }));
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await user.click(screen.getByRole("button", { name: en.gallery.features.open_report }));
    await user.click(screen.getByRole("button", { name: en.report.submit }));
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await user.click(screen.getByRole("button", { name: en.sessions.revoke }));
    await user.click(screen.getByRole("button", { name: en.media.retry }));
    await user.click(screen.getAllByRole("button", { name: en.composer.remove_attachment.replace("{{name}}", en.gallery.composer.attachment) })[0]!);
    expect(screen.getByRole("heading", { name: "poll_card" })).toBeInTheDocument();
  });
});
