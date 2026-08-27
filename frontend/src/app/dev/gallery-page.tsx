import { Star } from "lucide-react";
import { type CSSProperties, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useThemeControls } from "@/app/theme-provider";
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
import { ICON_CLASS, PROGRESS_MAX, SCROLL_DEMO_ROWS } from "@/shared/ui/metrics";

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
    </main>
  );
}
