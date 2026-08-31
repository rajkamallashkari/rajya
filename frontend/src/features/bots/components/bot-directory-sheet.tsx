import { useTranslation } from "react-i18next";
import { BotBuilderForm } from "@/features/bots/components/bot-builder-form";
import { StyleProfileConsent } from "@/features/bots/components/style-profile-consent";
import { useBots, useStartDirectChat } from "@/features/bots/api/queries";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
} from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

export function BotDirectorySheet({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation();
  const bots = useBots();
  const start = useStartDirectChat();
  const openConversation = useLayerStore((state) => state.openConversation);
  const rows = bots.data?.bots ?? [];

  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("bots.directory")}</BottomSheetTitle>
        <BottomSheetDescription className="sr-only">{t("bots.directory")}</BottomSheetDescription>
        <div className="flex flex-col gap-[var(--space-4)]">
          {rows.length === 0 ? <EmptyState title={t("bots.empty")} /> : null}
          {rows.map((bot) => (
            <div className="flex flex-col gap-[var(--space-2)]" key={bot.id}>
              <p className="[font-weight:var(--font-weight-emphasis)]">{bot.account.display_name}</p>
              <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                {bot.account.bio}
              </p>
              <Button
                disabled={start.isPending}
                onClick={() => {
                  start.mutate(bot.account.id, {
                    onSuccess: (conversation) => {
                      openConversation(
                        conversationLayer(String(conversation.id), bot.account.display_name),
                      );
                      onOpenChange(false);
                    },
                  });
                }}
                type="button"
                variant="secondary"
              >
                {t("bots.open", { name: bot.account.display_name })}
              </Button>
            </div>
          ))}
          <BotBuilderForm />
          <StyleProfileConsent />
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
