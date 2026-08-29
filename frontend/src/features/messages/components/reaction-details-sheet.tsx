import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/shared/ui";
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from "@/shared/ui/bottom-sheet";
import { EmptyState } from "@/shared/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export interface ReactionAccount {
  accountId: string;
  emoji: string;
  name: string;
}

export function ReactionDetailsSheet({
  onOpenChange,
  open,
  reactions,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reactions: ReactionAccount[];
}) {
  const { t } = useTranslation();
  const groups = useMemo(() => {
    const map = new Map<string, ReactionAccount[]>();
    for (const reaction of reactions) {
      const list = map.get(reaction.emoji) ?? [];
      list.push(reaction);
      map.set(reaction.emoji, list);
    }
    return [...map.entries()].map(([emoji, accounts]) => ({ accounts, emoji }));
  }, [reactions]);
  const first = groups[0]?.emoji ?? "all";
  const [tab, setTab] = useState(first);

  if (reactions.length === 0) {
    return (
      <BottomSheet onOpenChange={onOpenChange} open={open}>
        <BottomSheetContent>
          <BottomSheetTitle>{t("reactions.title")}</BottomSheetTitle>
          <EmptyState title={t("reactions.empty")} />
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  const active = groups.some((group) => group.emoji === tab) ? tab : first;

  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("reactions.title")}</BottomSheetTitle>
        <Tabs onValueChange={setTab} value={active}>
          <TabsList>
            {groups.map((group) => (
              <TabsTrigger key={group.emoji} value={group.emoji}>
                {t("reactions.count", { count: group.accounts.length, emoji: group.emoji })}
              </TabsTrigger>
            ))}
          </TabsList>
          {groups.map((group) => (
            <TabsContent key={group.emoji} value={group.emoji}>
              <ul className="flex flex-col">
                {group.accounts.map((account) => (
                  <li
                    className="flex min-h-[var(--control-height)] items-center gap-[var(--control-gap-tight)]"
                    key={`${account.accountId}-${account.emoji}`}
                  >
                    <Avatar name={account.name} />
                    <span>{account.name}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </BottomSheetContent>
    </BottomSheet>
  );
}
