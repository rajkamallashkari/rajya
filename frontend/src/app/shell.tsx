import { useRef } from "react";
import { ImpersonationBanner } from "@/app/banners/impersonation-banner";
import { OfflineBanner } from "@/app/banners/offline-banner";
import { ListErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { LayerHost } from "@/app/navigation/layer-host";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { ConversationThread } from "@/features/conversations/components/conversation-thread";
import { ProfilePanel } from "@/features/conversations/components/profile-panel";
import { useShellStore } from "@/features/settings/store/shell-store";
import { useShortcuts } from "@/shared/hooks/use-shortcuts";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";

export function AppShell() {
  const searchRef = useRef<HTMLInputElement>(null);
  const impersonatingName = useShellStore((state) => state.impersonatingName);
  const setImpersonatingName = useShellStore((state) => state.setImpersonatingName);
  const popLayer = useLayerStore((state) => state.popLayer);

  useShortcuts({
    onPopLayer: () => {
      if (useLayerStore.getState().layers.length > 0) {
        popLayer();
      }
    },
    searchRef,
  });

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--surface-app)] text-[var(--text-primary)]">
      {impersonatingName ? (
        <ImpersonationBanner name={impersonatingName} onExit={() => setImpersonatingName(null)} />
      ) : null}
      <OfflineBanner />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ListErrorBoundary>
          <LayerHost
            base={<ConversationList searchRef={searchRef} />}
            renderLayer={(layer) =>
              layer.kind === "conversation" ? (
                <ConversationThread conversationId={layer.conversationId} />
              ) : (
                <ProfilePanel conversationId={layer.conversationId} />
              )
            }
          />
        </ListErrorBoundary>
      </div>
    </div>
  );
}
