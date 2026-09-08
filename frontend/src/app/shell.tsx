import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ImpersonationBanner } from "@/app/banners/impersonation-banner";
import { OfflineBanner } from "@/app/banners/offline-banner";
import { AppLockOverlay } from "@/features/auth/components/app-lock-overlay";
import { AuthGate } from "@/features/auth/components/auth-gate";
import { OnboardingWizard } from "@/features/auth/components/onboarding-wizard";
import { ListErrorBoundary } from "@/app/error-boundaries/error-boundary";
import { CallsDestination } from "@/features/calls/components/calls-destination";
import { LayerHost } from "@/app/navigation/layer-host";
import { PrimaryNav } from "@/app/navigation/primary-nav";
import { SettingsLayer } from "@/app/lazy/settings-layer";
import { CallHost } from "@/app/lazy/call-host";
import { ProfileDestination } from "@/features/auth/components/profile-destination";
import { ChatsWelcome } from "@/features/conversations/components/chats-welcome";
import { ConversationList } from "@/features/conversations/components/conversation-list";
import { ConversationThread } from "@/features/conversations/components/conversation-thread";
import { NewGroupPanel } from "@/features/conversations/components/new-group-panel";
import { NewMessagePanel } from "@/features/conversations/components/new-message-panel";
import { ProfilePanel } from "@/features/conversations/components/profile-panel";
import { desktopChatHydration } from "@/features/conversations/model/recent";
import { MediaGalleryPanel } from "@/features/media";
import { TopCallBar, useSignalingChannel, useWebRTCManager } from "@/features/calls";
import { useAccountChannel } from "@/features/conversations/hooks/use-account-channel";
import { getMessage } from "@/features/conversations/api/http";
import { useConversations } from "@/features/conversations/api/queries";
import { conversationTitle } from "@/features/conversations/model/title";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { needsSignIn, SIGN_IN_QUERY } from "@/features/auth/model/session-gate";
import { useStopImpersonation } from "@/features/admin/api/queries";
import { useShellStore } from "@/features/settings/store/shell-store";
import { shouldHideMobileTabBar } from "@/shared/lib/navigation/destinations";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { useShortcuts } from "@/shared/hooks/use-shortcuts";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { cn } from "@/shared/lib/cn";
import { useSearchStore } from "@/features/search/store/search-store";

export function AppShell() {
  const { t } = useTranslation();
  const searchRef = useRef<HTMLInputElement>(null);
  const destination = useShellStore((state) => state.destination);
  const impersonatingName = useShellStore((state) => state.impersonatingName);
  const stopImpersonation = useStopImpersonation();
  const popLayer = useLayerStore((state) => state.popLayer);
  const openConversation = useLayerStore((state) => state.openConversation);
  const hasConversation = useLayerStore((state) =>
    state.layers.some((layer) => layer.kind === "conversation"),
  );
  const layerCount = useLayerStore((state) => state.layers.length);
  const mobile = useMobileViewport();
  const profileSettingsOpen = useShellStore((state) => state.profileSettingsOpen);
  const callsContact = useShellStore((state) => state.callsContact);
  const hideMobileTabBar = shouldHideMobileTabBar({
    destination,
    layerCount,
    mobile,
    nested: profileSettingsOpen || callsContact != null,
  });
  const hydrateAccounts = useAccountsStore((state) => state.hydrate);
  const setActiveAccount = useAccountsStore((state) => state.setActive);
  const needsOnboarding = useAccountsStore((state) => {
    const active = state.accounts.find((account) => account.id === state.activeAccountId);
    return active !== undefined && !active.onboarded;
  });
  const conversations = useConversations();
  const activeAccountId = useAccountsStore((state) => state.activeAccountId);
  const chatsOpenedRef = useRef(false);
  const params = useParams();
  const [searchParams] = useSearchParams();
  const signedOut = needsSignIn(
    activeAccountId,
    import.meta.env.VITE_MSW,
    searchParams.get(SIGN_IN_QUERY) === "1",
  );
  const showChrome = !signedOut && !needsOnboarding;
  const navigate = useNavigate();
  useAccountChannel();
  useSignalingChannel();
  useWebRTCManager();

  useEffect(() => {
    hydrateAccounts();
  }, [hydrateAccounts]);

  useEffect(() => {
    chatsOpenedRef.current = false;
  }, [activeAccountId]);

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
    const listed = conversations.data?.conversations.find(
      (row) => String(row.id) === conversationId,
    );
    openConversation(
      conversationLayer(
        conversationId,
        listed
          ? conversationTitle(listed, t("conversations.untitled"))
          : t("conversations.untitled"),
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
        navigate(`/c/${String(message.conversation_id)}/m/${String(message.id)}`, {
          replace: true,
        });
      })
      .catch(() => undefined);
  }, [navigate, params.conversationId, params.messageId]);

  useEffect(() => {
    const action = desktopChatHydration({
      alreadyAttempted: chatsOpenedRef.current,
      destination,
      hasConversation,
      isError: conversations.isError,
      isPending: conversations.isPending,
      layerCount,
      mobile,
      permalink: Boolean(params.conversationId || params.messageId),
      rows: conversations.data?.conversations ?? [],
    });
    if (action.kind === "ignore" || action.kind === "wait") {
      return;
    }
    chatsOpenedRef.current = true;
    if (action.kind === "remember" || !action.conversation) {
      return;
    }
    openConversation(
      conversationLayer(
        String(action.conversation.id),
        conversationTitle(action.conversation, t("conversations.untitled")),
      ),
    );
  }, [
    conversations.data,
    conversations.isError,
    conversations.isPending,
    destination,
    hasConversation,
    layerCount,
    mobile,
    openConversation,
    params.conversationId,
    params.messageId,
    t,
  ]);

  useShortcuts({
    onPopLayer: () => {
      const restored = useSearchStore.getState().handleBack();
      if (restored !== null) {
        return;
      }
      if (useShellStore.getState().profileSettingsOpen) {
        useShellStore.getState().setProfileSettingsOpen(false);
        return;
      }
      if (useShellStore.getState().callsContact) {
        useShellStore.getState().setCallsContact(null);
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
    <main className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--surface-app)] text-[var(--text-primary)]">
      <h1 className="sr-only">{t("brand.logo_alt")}</h1>
      {impersonatingName ? (
        <ImpersonationBanner name={impersonatingName} onExit={stopImpersonation} />
      ) : null}
      <OfflineBanner />
      <TopCallBar />
      <CallHost />
      <AppLockOverlay />
      {signedOut ? <AuthGate /> : null}
      {needsOnboarding ? <OnboardingWizard /> : null}
      <div
        className={cn("flex min-h-0 flex-1 overflow-hidden", mobile ? "flex-col" : "flex-row")}
        data-shell-destination={destination}
      >
        {showChrome && !mobile ? <PrimaryNav placement="rail" /> : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ListErrorBoundary>
            {destination === "chats" ? (
              <LayerHost
                base={<ConversationList searchRef={searchRef} />}
                empty={<ChatsWelcome />}
                renderLayer={(layer) => {
                  if (layer.kind === "conversation") {
                    return <ConversationThread conversationId={layer.conversationId} />;
                  }
                  if (layer.kind === "gallery") {
                    return <MediaGalleryPanel conversationId={layer.conversationId} />;
                  }
                  if (layer.kind === "settings") {
                    return <SettingsLayer />;
                  }
                  if (layer.kind === "compose_message") {
                    return <NewMessagePanel />;
                  }
                  if (layer.kind === "compose_group") {
                    return <NewGroupPanel />;
                  }
                  return (
                    <ProfilePanel
                      accountId={layer.accountId}
                      conversationId={layer.conversationId}
                    />
                  );
                }}
              />
            ) : null}
            {destination === "profile" ? <ProfileDestination /> : null}
            {destination === "calls" ? <CallsDestination /> : null}
          </ListErrorBoundary>
        </div>
        {showChrome && mobile && !hideMobileTabBar ? <PrimaryNav placement="bar" /> : null}
      </div>
    </main>
  );
}
