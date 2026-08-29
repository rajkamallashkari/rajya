import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PickerSheet, SlashCommandMenu } from "@/features/composer";
import { QrSheet, ReportSheet } from "@/features/conversations";
import {
  ContactCard,
  LocationCard,
  PollCard,
  PollResultsSheet,
  ReactionDetailsSheet,
  SelectionToolbar,
  TranscriptBlock,
} from "@/features/messages";
import type { PollView } from "@/features/messages/model/poll";
import { AppearancePanel, SessionListItem, WallpaperPicker } from "@/features/settings";
import { Button } from "@/shared/ui";

export function galleryFeatureAction(): void {}

const ADA = "Ada Lovelace";

function demoPoll(overrides: Partial<PollView> = {}): PollView {
  return {
    allowsMultiple: false,
    closed: false,
    closesAt: "Tomorrow 18:00",
    isAnonymous: false,
    options: [
      {
        id: "yes",
        label: "Yes",
        position: 0,
        selected: true,
        voteCount: 3,
        voters: [
          { accountId: "1", name: ADA },
          { accountId: "2", name: "Priya" },
        ],
      },
      {
        id: "no",
        label: "No",
        position: 1,
        selected: false,
        voteCount: 0,
        voters: [],
      },
    ],
    question: "Ship Friday?",
    voterCount: 3,
    ...overrides,
  };
}

export function GalleryFeatureSections({
  Section,
}: {
  Section: ({ sectionKey, children }: { sectionKey: string; children: ReactNode }) => ReactNode;
}) {
  const { t } = useTranslation();
  const [poll, setPoll] = useState(demoPoll());
  const [pollOpen, setPollOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selected, setSelected] = useState(2);
  const [slashQuery, setSlashQuery] = useState("/");

  return (
    <>
      <Section sectionKey="poll_card">
        <div className="flex flex-col gap-[var(--space-4)]">
          <PollCard
            onOpenResults={() => setPollOpen(true)}
            onVote={(ids) =>
              setPoll((current) => ({
                ...current,
                options: current.options.map((option) => ({
                  ...option,
                  selected: ids.includes(option.id),
                })),
              }))
            }
            poll={poll}
          />
          <PollCard
            poll={demoPoll({
              closed: true,
              isAnonymous: true,
              allowsMultiple: true,
              closesAt: null,
            })}
          />
          <Button onClick={() => setPollOpen(true)} type="button" variant="secondary">
            {t("gallery.features.open_results")}
          </Button>
          <PollResultsSheet onOpenChange={setPollOpen} open={pollOpen} poll={poll} />
        </div>
      </Section>

      <Section sectionKey="reaction_details">
        <Button onClick={() => setReactOpen(true)} type="button" variant="secondary">
          {t("gallery.features.open_reactions")}
        </Button>
        <ReactionDetailsSheet
          onOpenChange={setReactOpen}
          open={reactOpen}
          reactions={[
            { accountId: "1", emoji: "👍", name: ADA },
            { accountId: "2", emoji: "❤️", name: "Priya" },
          ]}
        />
      </Section>

      <Section sectionKey="selection_toolbar">
        <SelectionToolbar
          count={selected}
          onClear={() => setSelected(0)}
          onCopy={galleryFeatureAction}
          onDelete={galleryFeatureAction}
          onForward={galleryFeatureAction}
          onSave={galleryFeatureAction}
          onSelectAll={() => setSelected(4)}
        />
        <Button
          className="mt-[var(--space-2)]"
          onClick={() => setSelected(2)}
          type="button"
          variant="ghost"
        >
          {t("selection.select_all")}
        </Button>
      </Section>

      <Section sectionKey="picker_sheet">
        <Button onClick={() => setPickerOpen(true)} type="button" variant="secondary">
          {t("gallery.features.open_picker")}
        </Button>
        <PickerSheet
          gifs={[
            { id: "g1", previewLabel: t("gallery.features.gif"), title: t("gallery.features.gif") },
          ]}
          onOpenChange={setPickerOpen}
          onPickEmoji={galleryFeatureAction}
          onPickGif={galleryFeatureAction}
          onPickReply={galleryFeatureAction}
          onPickSticker={galleryFeatureAction}
          open={pickerOpen}
          replies={[
            {
              body: t("gallery.features.reply_body"),
              id: "r1",
              shortcut: t("gallery.features.reply_shortcut"),
            },
          ]}
          stickers={[{ id: "s1", packId: "p1", shortcode: t("gallery.features.sticker") }]}
        />
      </Section>

      <Section sectionKey="location_card">
        <LocationCard
          location={{
            accuracyM: 12,
            label: t("gallery.messages.body"),
            latitude: 12.9716,
            longitude: 77.5946,
          }}
          onOpen={galleryFeatureAction}
        />
      </Section>

      <Section sectionKey="contact_card">
        <div className="flex flex-col gap-[var(--space-3)]">
          <ContactCard
            contact={{
              contactAccountId: "42",
              displayName: t("gallery.messages.sender"),
              email: "ada@rajya.pages.dev",
              phone: "+1 555 0100",
            }}
            onMessage={galleryFeatureAction}
            onOpenProfile={galleryFeatureAction}
          />
          <ContactCard
            contact={{
              contactAccountId: null,
              displayName: t("gallery.avatar.single"),
              email: null,
              phone: null,
            }}
          />
        </div>
      </Section>

      <Section sectionKey="transcript_block">
        <div className="flex flex-col gap-[var(--space-3)]">
          <TranscriptBlock language={null} status="pending" text={null} />
          <TranscriptBlock language="en" status="ready" text={t("gallery.messages.body")} />
          <TranscriptBlock language={null} status="failed" text={null} />
        </div>
      </Section>

      <Section sectionKey="slash_commands">
        <SlashCommandMenu
          commands={[
            {
              description: t("search.placeholder"),
              name: "search",
              source: "builtin",
              usageHint: "/search q",
            },
            { description: t("gallery.messages.body"), name: "status", source: "bot" },
          ]}
          onSelect={galleryFeatureAction}
          query={slashQuery}
        />
        <Button
          className="mt-[var(--space-2)]"
          onClick={() => setSlashQuery("/z")}
          type="button"
          variant="ghost"
        >
          {t("slash.empty")}
        </Button>
      </Section>

      <Section sectionKey="wallpaper_picker">
        <AppearancePanel />
        <WallpaperPicker />
      </Section>

      <Section sectionKey="qr_sheet">
        <Button onClick={() => setQrOpen(true)} type="button" variant="secondary">
          {t("gallery.features.open_qr")}
        </Button>
        <QrSheet
          onCopy={galleryFeatureAction}
          onOpenChange={setQrOpen}
          open={qrOpen}
          payload="https://rajya.pages.dev"
        />
      </Section>

      <Section sectionKey="report_sheet">
        <Button onClick={() => setReportOpen(true)} type="button" variant="secondary">
          {t("gallery.features.open_report")}
        </Button>
        <ReportSheet
          onOpenChange={setReportOpen}
          onSubmit={galleryFeatureAction}
          open={reportOpen}
          reasons={[{ id: "spam", label: t("gallery.features.reason_spam") }]}
          subjectType="message"
        />
      </Section>

      <Section sectionKey="session_list_item">
        <SessionListItem
          onRevoke={galleryFeatureAction}
          session={{
            current: false,
            deviceLabel: t("gallery.avatar.name"),
            expiresAt: "2026-09-01T00:00:00.000Z",
            id: "s1",
            ip: "203.0.113.10",
            lastSeenAt: "2026-08-29T12:00:00.000Z",
            revoked: false,
            userAgent: "Safari",
          }}
        />
        <SessionListItem
          session={{
            current: true,
            deviceLabel: null,
            expiresAt: "2026-09-01T00:00:00.000Z",
            id: "s2",
            ip: null,
            lastSeenAt: "2026-08-29T12:00:00.000Z",
            revoked: false,
            userAgent: null,
          }}
        />
      </Section>
    </>
  );
}
