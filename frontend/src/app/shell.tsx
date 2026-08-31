import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ImpersonationBanner } from "@/app/banners/impersonation-banner";
import { OfflineBanner } from "@/app/banners/offline-banner";
import { AppLockOverlay } from "@/features/auth/components/app-lock-overlay";
import { OnboardingWizard } from "@/features/auth/components/onboarding-wizard";
import { ListErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { LayerHost } from "@/app/navigation/layer-host";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { ConversationThread } from "@/features/conversations/components/conversation-thread";
import { ProfilePanel } from "@/features/conversations/components/profile-panel";
import { MediaGalleryPanel } from "@/features/media";
import { useSignalingChannel, useWebRTCManager } from "@/features/calls";
import { useAccountChannel } from "@/features/conversations/hooks/use-account-channel";
import { getMessage } from "@/features/conversations/api/http";
import { useConversations } from "@/features/conversations/api/queries";
import { conversationTitle } from "@/features/conversations/model/title";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { useShellStore } from "@/features/settings/store/shell-store";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { useShortcuts } from "@/shared/hooks/use-shortcuts";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { useSearchStore } from "@/features/search/store/search-store";

export function AppShell() {
  const { t } = useTranslation();
  const searchRef = useRef<HTMLInputElement>(null);
  const impersonatingName = useShellStore((state) => state.impersonatingName);
  const setImpersonatingName = useShellStore((state) => state.setImpersonatingName);
  const popLayer = useLayerStore((state) => state.popLayer);
  const openConversation = useLayerStore((state) => state.openConversation);
  const hasConversation = useLayerStore((state) =>
    state.layers.some((layer) => layer.kind === "conversation"),
  );
  const mobile = useMobileViewport();
  const hydrateAccounts = useAccountsStore((state) => state.hydrate);
  const setActiveAccount = useAccountsStore((state) => state.setActive);
  const needsOnboarding = useAccountsStore((state) => {
    const active = state.accounts.find((account) => account.id === state.activeAccountId);
    return active !== undefined && !active.onboarded;
  });
  const conversations = useConversations();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useAccountChannel();
  useSignalingChannel();
  useWebRTCManager();

  useEffect(() => {
    hydrateAccounts();
  }, [hydrateAccounts]);

  useEffect(() => {
    const account = Number(searchParams.get("account"));
    if (!Number.isFinite(account) || account < 1) {
      return;
    }
    setActiveAccount(account);
  }, [searchParams, setActiveAccount]);

  useEffect(() => {
    const conversationId = params.conversationId;
    if (!conversationId) {
      return;
    }
    const listed = conversations.data?.conversations.find((row) => String(row.id) === conversationId);
    openConversation(
      conversationLayer(
        conversationId,
        listed ? conversationTitle(listed, t("conversations.untitled")) : t("conversations.untitled"),
        params.messageId,
      ),
    );
  }, [conversations.data, openConversation, params.conversationId, params.messageId, t]);

  useEffect(() => {
    const messageId = params.messageId;
    if (!messageId || params.conversationId) {
      return;
    }
    void getMessage(Number(messageId))
      .then((message) => {
        navigate(`/c/${String(message.conversation_id)}/m/${String(message.id)}`, { replace: true });
      })
      .catch(() => undefined);
  }, [navigate, params.conversationId, params.messageId]);

  useEffect(() => {
    if (mobile || hasConversation) {
      return;
    }
    const first = conversations.data?.conversations[0];
    if (!first) {
      return;
    }
    openConversation(
      conversationLayer(String(first.id), conversationTitle(first, t("conversations.untitled"))),
    );
  }, [conversations.data, hasConversation, mobile, openConversation, t]);

  useShortcuts({
    onPopLayer: () => {
      const restored = useSearchStore.getState().handleBack();
      if (restored !== null) {
        return;
      }
      const layers = useLayerStore.getState().layers;
      if (layers.length === 0) {
        return;
      }
      if (!mobile && layers.length === 1 && layers[0]?.kind === "conversation") {
        return;
      }
      popLayer();
    },
    searchRef,
  });

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--surface-app)] text-[var(--text-primary)]">
      {impersonatingName ? (
        <ImpersonationBanner name={impersonatingName} onExit={() => setImpersonatingName(null)} />
      ) : null}
      <OfflineBanner />
      <AppLockOverlay />
      {needsOnboarding ? <OnboardingWizard /> : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ListErrorBoundary>
          <LayerHost
            base={<ConversationList searchRef={searchRef} />}
            renderLayer={(layer) => {
              if (layer.kind === "conversation") {
                return <ConversationThread conversationId={layer.conversationId} />;
              }
              if (layer.kind === "gallery") {
                return <MediaGalleryPanel conversationId={layer.conversationId} />;
              }
              return (
                <ProfilePanel
                  accountId={layer.accountId}
                  conversationId={layer.conversationId}
                />
              );
            }}
          />
        </ListErrorBoundary>
      </div>
    </div>
  );
}
