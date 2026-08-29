import { Star } from "lucide-react";
import { type CSSProperties, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeControls } from "@/app/theme-provider";
import { ImpersonationBanner } from "@/app/banners/impersonation-banner";
import { OfflineBanner } from "@/app/banners/offline-banner";
import { LayerHost } from "@/app/navigation/layer-host";
import { Composer, type VoiceRecorderResult } from "@/features/composer";
import { ChatListItem, ConversationThread, ProfilePanel } from "@/features/conversations";
import { ADA_DEMO } from "@/features/conversations/model/demo";
import {
  DateDivider,
  MessageBubble,
  MessageContent,
  MessageContextMenu,
  MessageGroup,
  SystemMessage,
  TickIndicator,
  TypingBubble,
  UnreadDivider,
  type TickStatus,
} from "@/features/messages";
import {
  accentContrast,
  ACCENT_CONTRAST_NEAR_BLACK,
  ACCENT_CONTRAST_WHITE,
  DENSITY_VALUES,
  DENSITY_VARS,
  SEMANTIC_DEFAULTS,
  type Density,
  type ResolvedTheme,
} from "@/shared/lib/theme";
import {
  Avatar,
  Badge,
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
  Button,
  Checkbox,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  IconButton,
  Input,
  ListView,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressRing,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  showToast,
  SimpleTooltip,
} from "@/shared/ui";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { ICON_CLASS, PROGRESS_MAX, SCROLL_DEMO_ROWS } from "@/shared/ui/metrics";
import { GalleryFeatureSections } from "@/app/dev/gallery-features";

export function galleryAction(): void {}

export async function galleryAsyncAction(): Promise<void> {}

export const GALLERY_SECTION_KEYS = [
  "button",
  "icon_button",
  "input",
  "textarea",
  "select",
  "switch",
  "slider",
  "checkbox",
  "radio",
  "avatar",
  "badge",
  "tooltip",
  "popover",
  "dropdown_menu",
  "context_menu",
  "dialog",
  "bottom_sheet",
  "drawer",
  "tabs",
  "skeleton",
  "spinner",
  "toast",
  "empty_state",
  "scroll_area",
  "separator",
  "progress_ring",
  "message_bubble",
  "message_content",
  "tick_indicator",
  "system_message",
  "date_divider",
  "unread_divider",
  "typing_bubble",
  "composer",
  "chat_list_item",
  "message_context_menu",
  "list_states",
  "offline_banner",
  "impersonation_banner",
  "layer_host",
  "poll_card",
  "reaction_details",
  "selection_toolbar",
  "picker_sheet",
  "location_card",
  "contact_card",
  "transcript_block",
  "slash_commands",
  "wallpaper_picker",
  "qr_sheet",
  "report_sheet",
  "session_list_item",
] as const;

const THEME_CHOICES = ["light", "dark", "system"] as const;
const RESOLVED_THEMES: ResolvedTheme[] = ["light", "dark"];

function rowClass(): string {
  return "flex flex-wrap items-center gap-[var(--control-gap)] py-[var(--space-list-y)]";
}

function Section({ sectionKey, children }: { sectionKey: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <section
      className="border-b border-[var(--border-subtle)] py-[var(--space-list-y)]"
      aria-labelledby={`gallery-${sectionKey}`}
    >
      <h2 id={`gallery-${sectionKey}`} className="mb-[var(--space-3)] text-[var(--text-secondary)]">
        {t(`gallery.sections.${sectionKey}`)}
      </h2>
      {children}
    </section>
  );
}

function CombinationFrame({ theme, density }: { theme: ResolvedTheme; density: Density }) {
  const { t } = useTranslation();
  const palette = SEMANTIC_DEFAULTS[theme];
  const densityVars = DENSITY_VARS[density];
  const contrast = accentContrast(
    palette["--accent"],
    ACCENT_CONTRAST_WHITE,
    ACCENT_CONTRAST_NEAR_BLACK,
  );
  const style = {
    ...palette,
    ...densityVars,
    "--color-accent-primary": palette["--accent"],
    "--accent-contrast": contrast,
  } as CSSProperties;

  return (
    <div
      data-combination={`${theme}-${density}`}
      className={theme === "dark" ? "dark" : undefined}
      style={style}
    >
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-[var(--space-4)]">
        <p className="mb-[var(--space-3)] text-[var(--text-secondary)]">
          {t(`gallery.theme.${theme}`)}
          {" · "}
          {t(`gallery.density.${density}`)}
        </p>
        <div className={rowClass()}>
          <Button size="sm">{t("gallery.button.primary")}</Button>
          <Badge>{t("gallery.badge.unread")}</Badge>
          <Switch aria-label={t("gallery.switch.label")} />
        </div>
        <div className="mt-[var(--space-3)]">
          <MessageBubble
            body={t("gallery.messages.body")}
            createdAt="2026-08-27T12:00:00.000Z"
            side="sent"
            status="read"
          />
        </div>
        <div className="mt-[var(--space-3)]">
          <ChatListItem
            lastActivity={{ kind: "text", text: t("gallery.messages.list_preview") }}
            name={t("gallery.messages.sender")}
            presence="online"
            timestampLabel={t("gallery.messages.list_time")}
            unreadCount={2}
          />
        </div>
      </div>
    </div>
  );
}

export function GalleryPage() {
  const { t } = useTranslation();
  const { input, setInput } = useThemeControls();
  const progressDemo = PROGRESS_MAX / 2;

  return (
    <main
      data-gallery=""
      data-density={input.density}
      data-theme-preference={input.theme}
      className="min-h-[100dvh] bg-[var(--surface-app)] pt-[max(var(--inset-page),var(--safe-area-top))] pr-[max(var(--space-list-x),var(--safe-area-right))] pb-[max(var(--inset-page),var(--safe-area-bottom))] pl-[max(var(--space-list-x),var(--safe-area-left))] text-[var(--text-primary)]"
    >
      <h1 className="mb-[var(--space-4)]">{t("gallery.title")}</h1>

      <div className={rowClass()} role="group" aria-label={t("gallery.theme_legend")}>
        {THEME_CHOICES.map((theme) => (
          <Button
            key={theme}
            variant={input.theme === theme ? "primary" : "secondary"}
            size="sm"
            onClick={() => setInput({ theme })}
          >
            {t(`gallery.theme.${theme}`)}
          </Button>
        ))}
      </div>

      <div className={rowClass()} role="group" aria-label={t("gallery.density_legend")}>
        {DENSITY_VALUES.map((density) => (
          <Button
            key={density}
            variant={input.density === density ? "primary" : "secondary"}
            size="sm"
            onClick={() => setInput({ density })}
          >
            {t(`gallery.density.${density}`)}
          </Button>
        ))}
      </div>

      <section className="py-[var(--space-list-y)]" aria-labelledby="gallery-combinations">
        <h2 id="gallery-combinations" className="mb-[var(--space-3)] text-[var(--text-secondary)]">
          {t("gallery.combinations")}
        </h2>
        <div className="grid gap-[var(--space-3)]">
          {RESOLVED_THEMES.flatMap((theme) =>
            DENSITY_VALUES.map((density) => (
              <CombinationFrame key={`${theme}-${density}`} theme={theme} density={density} />
            )),
          )}
        </div>
      </section>

      <Section sectionKey="button">
        <div className={rowClass()}>
          <Button variant="primary">{t("gallery.button.primary")}</Button>
          <Button variant="secondary">{t("gallery.button.secondary")}</Button>
          <Button variant="ghost">{t("gallery.button.ghost")}</Button>
          <Button variant="danger">{t("gallery.button.danger")}</Button>
        </div>
        <div className={rowClass()}>
          <Button size="sm">{t("gallery.button.sm")}</Button>
          <Button size="md">{t("gallery.button.md")}</Button>
          <Button size="lg">{t("gallery.button.lg")}</Button>
        </div>
      </Section>

      <Section sectionKey="icon_button">
        <IconButton aria-label={t("gallery.icon_button.label")}>
          <Star className={ICON_CLASS} />
        </IconButton>
      </Section>

      <Section sectionKey="input">
        <Input placeholder={t("gallery.input.placeholder")} />
      </Section>

      <Section sectionKey="textarea">
        <Textarea placeholder={t("gallery.textarea.placeholder")} />
      </Section>

      <Section sectionKey="select">
        <Select>
          <SelectTrigger aria-label={t("gallery.sections.select")}>
            <SelectValue placeholder={t("ui.select_placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">{t("gallery.select.apple")}</SelectItem>
            <SelectItem value="orange">{t("gallery.select.orange")}</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section sectionKey="switch">
        <Switch aria-label={t("gallery.switch.label")} />
      </Section>

      <Section sectionKey="slider">
        <Slider aria-label={t("gallery.slider.label")} defaultValue={[progressDemo]} />
      </Section>

      <Section sectionKey="checkbox">
        <label className={rowClass()}>
          <Checkbox />
          <span>{t("gallery.checkbox.label")}</span>
        </label>
      </Section>

      <Section sectionKey="radio">
        <RadioGroup defaultValue="everyone" aria-label={t("gallery.radio.label")}>
          <label className={rowClass()}>
            <RadioGroupItem value="everyone" />
            <span>{t("gallery.radio.everyone")}</span>
          </label>
          <label className={rowClass()}>
            <RadioGroupItem value="contacts" />
            <span>{t("gallery.radio.contacts")}</span>
          </label>
        </RadioGroup>
      </Section>

      <Section sectionKey="avatar">
        <div className={rowClass()}>
          <Avatar name={t("gallery.avatar.name")} presence="online" />
          <Avatar name={t("gallery.avatar.single")} presence="away" />
          <Avatar presence="offline" />
        </div>
      </Section>

      <Section sectionKey="badge">
        <div className={rowClass()}>
          <Badge>{t("gallery.badge.unread")}</Badge>
          <Badge variant="muted">{t("gallery.badge.muted")}</Badge>
          <Badge variant="success">{t("gallery.badge.unread")}</Badge>
          <Badge variant="warning">{t("gallery.badge.muted")}</Badge>
          <Badge variant="danger">{t("gallery.badge.unread")}</Badge>
        </div>
      </Section>

      <Section sectionKey="tooltip">
        <SimpleTooltip content={t("gallery.tooltip.content")}>
          <Button variant="secondary">{t("gallery.tooltip.trigger")}</Button>
        </SimpleTooltip>
      </Section>

      <Section sectionKey="popover">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">{t("gallery.popover.trigger")}</Button>
          </PopoverTrigger>
          <PopoverContent>{t("gallery.popover.content")}</PopoverContent>
        </Popover>
      </Section>

      <Section sectionKey="dropdown_menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">{t("gallery.menu.trigger")}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>{t("gallery.menu.edit")}</DropdownMenuItem>
            <DropdownMenuItem>{t("gallery.menu.delete")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section sectionKey="context_menu">
        <ContextMenu>
          <ContextMenuTrigger>
            <p className="rounded-[var(--radius-md)] bg-[var(--surface-panel)] p-[var(--space-4)]">
              {t("gallery.menu.context_target")}
            </p>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>{t("gallery.menu.edit")}</ContextMenuItem>
            <ContextMenuItem>{t("gallery.menu.delete")}</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Section>

      <Section sectionKey="dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">{t("gallery.dialog.trigger")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{t("gallery.dialog.title")}</DialogTitle>
            <DialogDescription>{t("gallery.dialog.description")}</DialogDescription>
            <Button className="mt-[var(--space-4)]">{t("gallery.dialog.confirm")}</Button>
          </DialogContent>
        </Dialog>
      </Section>

      <Section sectionKey="bottom_sheet">
        <BottomSheet>
          <BottomSheetTrigger asChild>
            <Button variant="secondary">{t("gallery.sheet.trigger")}</Button>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetTitle>{t("gallery.sheet.title")}</BottomSheetTitle>
            <p>{t("gallery.sheet.body")}</p>
          </BottomSheetContent>
        </BottomSheet>
      </Section>

      <Section sectionKey="drawer">
        <div className={rowClass()}>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">{t("gallery.drawer.trigger")}</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>{t("gallery.drawer.title")}</DrawerTitle>
              <p>{t("gallery.drawer.body")}</p>
            </DrawerContent>
          </Drawer>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost">{t("gallery.drawer.trigger")}</Button>
            </DrawerTrigger>
            <DrawerContent side="left">
              <DrawerTitle>{t("gallery.drawer.title")}</DrawerTitle>
              <p>{t("gallery.drawer.body")}</p>
            </DrawerContent>
          </Drawer>
        </div>
      </Section>

      <Section sectionKey="tabs">
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">{t("gallery.tabs.one")}</TabsTrigger>
            <TabsTrigger value="two">{t("gallery.tabs.two")}</TabsTrigger>
          </TabsList>
          <TabsContent value="one">{t("gallery.tabs.one_body")}</TabsContent>
          <TabsContent value="two">{t("gallery.tabs.two_body")}</TabsContent>
        </Tabs>
      </Section>

      <Section sectionKey="skeleton">
        <Skeleton className="h-[var(--space-8)] w-full" />
      </Section>

      <Section sectionKey="spinner">
        <Spinner label={t("app.loading")} />
      </Section>

      <Section sectionKey="toast">
        <Button
          variant="secondary"
          onClick={() =>
            showToast({
              title: t("gallery.toast.title"),
              description: t("gallery.toast.description"),
            })
          }
        >
          {t("gallery.toast.trigger")}
        </Button>
      </Section>

      <Section sectionKey="empty_state">
        <EmptyState
          title={t("gallery.empty.title")}
          description={t("gallery.empty.description")}
          action={<Button>{t("gallery.empty.action")}</Button>}
        />
      </Section>

      <Section sectionKey="scroll_area">
        <ScrollArea className="h-[calc(var(--space-16)*3)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          {Array.from({ length: SCROLL_DEMO_ROWS }, (_, index) => (
            <p
              key={index}
              className="px-[var(--space-list-x)] py-[var(--space-list-y)] text-[var(--text-primary)]"
            >
              {t("gallery.scroll.item", { n: index + 1 })}
            </p>
          ))}
        </ScrollArea>
      </Section>

      <Section sectionKey="separator">
        <Separator />
      </Section>

      <Section sectionKey="progress_ring">
        <ProgressRing value={progressDemo} label={t("gallery.progress.label")} />
      </Section>

      <Section sectionKey="message_bubble">
        <div className="flex flex-col gap-[var(--space-4)]">
          <MessageGroup
            messages={[
              { body: t("gallery.messages.body"), createdAt: "2026-08-27T12:00:00.000Z", id: "g1" },
              {
                body: t("gallery.messages.plain"),
                createdAt: "2026-08-27T12:01:00.000Z",
                id: "g2",
              },
            ]}
            senderName={t("gallery.messages.sender")}
            side="received"
          />
          <MessageBubble
            body={t("gallery.messages.jumbo")}
            createdAt="2026-08-27T12:02:00.000Z"
            side="sent"
            status="delivered"
          />
          <MessageBubble
            body={t("gallery.messages.queued")}
            createdAt="2026-08-27T12:03:00.000Z"
            side="sent"
            status="queued"
          />
          <MessageBubble
            body={t("gallery.messages.failed")}
            createdAt="2026-08-27T12:04:00.000Z"
            side="sent"
            status="failed"
          />
        </div>
      </Section>

      <Section sectionKey="message_content">
        <div className="flex flex-col gap-[var(--space-4)]">
          <MessageBubble body={t("gallery.messages.formatted")} side="received" />
          <MessageBubble body={t("gallery.messages.formatted")} side="sent" status="sent" />
          <MessageContent body={t("gallery.messages.formatted")} />
        </div>
      </Section>

      <Section sectionKey="tick_indicator">
        <div className={rowClass()}>
          {(["queued", "sent", "delivered", "read", "failed"] as const satisfies TickStatus[]).map(
            (status) => (
              <TickIndicator key={status} status={status} />
            ),
          )}
        </div>
      </Section>

      <Section sectionKey="system_message">
        <SystemMessage eventKey="member_joined" values={{ name: t("gallery.messages.sender") }} />
      </Section>

      <Section sectionKey="date_divider">
        <DateDivider label={t("gallery.messages.today")} />
      </Section>

      <Section sectionKey="unread_divider">
        <UnreadDivider />
      </Section>

      <Section sectionKey="typing_bubble">
        <TypingBubble senderName={t("gallery.messages.sender")} />
      </Section>

      <Section sectionKey="composer">
        <GalleryComposer />
      </Section>

      <Section sectionKey="chat_list_item">
        <div className="flex flex-col gap-[var(--space-2)]">
          <ChatListItem
            isGroup
            lastActivity={{
              kind: "text",
              senderName: t("gallery.messages.sender"),
              text: t("gallery.messages.list_preview"),
            }}
            name={t("gallery.messages.sender")}
            pinned
            presence="online"
            timestampLabel={t("gallery.messages.list_time")}
            unreadCount={12}
          />
          <ChatListItem
            lastActivity={{ kind: "typing", text: "" }}
            muted
            name={t("gallery.avatar.name")}
            timestampLabel={t("gallery.messages.list_time")}
          />
          <ChatListItem
            lastActivity={{ kind: "system", text: t("messages.system.icon_changed") }}
            markedUnread
            name={t("gallery.avatar.single")}
            timestampLabel={t("gallery.messages.list_time")}
          />
          <ChatListItem
            lastActivity={{ kind: "media", mediaType: "image", text: "" }}
            name={t("gallery.messages.sender")}
            timestampLabel={t("gallery.messages.list_time")}
          />
        </div>
      </Section>

      <Section sectionKey="message_context_menu">
        <GalleryMessageMenu />
      </Section>

      <Section sectionKey="list_states">
        <div className="flex flex-col gap-[var(--space-4)]">
          <ListView status="loading">{null}</ListView>
          <ListView action={<Button>{t("lists.empty_action")}</Button>} status="empty">
            {null}
          </ListView>
          <ListView onRetry={galleryAction} status="error">
            {null}
          </ListView>
        </div>
      </Section>

      <Section sectionKey="offline_banner">
        <OfflineBanner force />
      </Section>

      <Section sectionKey="impersonation_banner">
        <ImpersonationBanner name={t("gallery.avatar.name")} onExit={galleryAction} />
      </Section>

      <Section sectionKey="layer_host">
        <GalleryLayerDemo />
      </Section>

      <GalleryFeatureSections Section={Section} />
    </main>
  );
}

const GALLERY_VOICE_PEAKS = [
  0.12, 0.28, 0.55, 0.9, 0.4, 0.22, 0.7, 0.95, 0.6, 0.35, 0.18, 0.5, 0.82, 0.45, 0.3, 0.75, 0.88,
  0.2, 0.42, 0.65, 0.92, 0.38, 0.15, 0.58, 0.8, 0.48, 0.25, 0.7, 0.33, 0.6, 0.85, 0.44,
];

const GALLERY_VOICE: VoiceRecorderResult = {
  canResume: false,
  cancel: galleryAction,
  durationMs: 4200,
  finalPeaks: [],
  mimeType: "audio/webm",
  pause: galleryAction,
  peaks: GALLERY_VOICE_PEAKS,
  previewBlob: null,
  resume: galleryAction,
  start: galleryAsyncAction,
  state: "recording",
  stop: galleryAction,
};

const GALLERY_VOICE_PREVIEW: VoiceRecorderResult = {
  ...GALLERY_VOICE,
  canResume: true,
  durationMs: 65000,
  finalPeaks: GALLERY_VOICE_PEAKS,
  previewBlob: new Blob(["gallery-voice"], { type: "audio/webm" }),
  state: "paused",
};

function GalleryComposer() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [reply, setReply] = useState(true);
  const [scheduled, setScheduled] = useState(t("gallery.composer.schedule"));
  const [files, setFiles] = useState([{ id: "g1", name: t("gallery.composer.attachment") }]);
  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Composer
        attachments={files}
        onAttach={() =>
          setFiles((current) => [
            ...current,
            { id: `g${current.length + 1}`, name: t("gallery.composer.attachment") },
          ])
        }
        onChange={setText}
        onClearSchedule={() => setScheduled("")}
        onDismissReply={() => setReply(false)}
        onOpenSchedule={galleryAction}
        onRemoveAttachment={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
        onRewrite={galleryAction}
        onSchedule={() => setScheduled(t("gallery.composer.schedule"))}
        onSend={() => setText("")}
        replyTo={
          reply
            ? {
                preview: t("gallery.messages.reply_preview"),
                senderName: t("gallery.messages.sender"),
              }
            : null
        }
        scheduledLabel={scheduled || null}
        value={text}
      />
      <Composer
        defaultValue={t("gallery.messages.body")}
        editing
        onDismissEdit={galleryAction}
        onSend={galleryAction}
      />
      <Composer onSend={galleryAction} onVoiceSend={galleryAction} voice={GALLERY_VOICE} />
      <Composer onSend={galleryAction} onVoiceSend={galleryAction} voice={GALLERY_VOICE_PREVIEW} />
    </div>
  );
}

function GalleryMessageMenu() {
  const { t } = useTranslation();
  const [menu, setMenu] = useState<{ clientX: number; clientY: number } | null>(null);
  return (
    <div>
      <MessageBubble
        body={t("gallery.messages.body")}
        createdAt="2026-08-27T12:00:00.000Z"
        lifted={menu !== null}
        onOpenMenu={setMenu}
        side="sent"
        status="delivered"
      />
      {menu ? (
        <MessageContextMenu
          actions={{
            canEdit: true,
            hasText: true,
            isMine: true,
            onCopy: galleryAction,
            onEdit: galleryAction,
            onForward: galleryAction,
            onInfo: galleryAction,
            onPin: galleryAction,
            onReact: galleryAction,
            onReply: galleryAction,
            onSave: galleryAction,
            onUnsend: galleryAction,
          }}
          onClose={() => setMenu(null)}
          x={menu.clientX}
          y={menu.clientY}
        />
      ) : null}
    </div>
  );
}

function GalleryLayerDemo() {
  const { t } = useTranslation();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const demo = ADA_DEMO;
  return (
    <div className="h-[calc(var(--space-16)*8)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
      <LayerHost
        base={
          <Button
            onClick={() =>
              pushLayer({
                conversationId: demo.id,
                id: `conversation:${demo.id}`,
                kind: "conversation",
                title: demo.name,
              })
            }
            type="button"
          >
            {t("layers.push_demo")}
          </Button>
        }
        renderLayer={(layer) =>
          layer.kind === "conversation" ? (
            <ConversationThread conversationId={layer.conversationId} />
          ) : (
            <ProfilePanel conversationId={layer.conversationId} />
          )
        }
      />
    </div>
  );
}
