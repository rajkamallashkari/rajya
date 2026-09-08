import { type ReactNode } from "react";
import { SettingsLayer } from "@/app/lazy/settings-layer";
import { SelfProfilePane } from "@/features/auth/components/self-profile-pane";
import { useShellStore } from "@/features/settings/store/shell-store";
import { useLayer } from "@/shared/hooks/use-layer";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { cn } from "@/shared/lib/cn";

const PROFILE_SETTINGS_LAYER_ID = "profile-settings";

export function ProfileDestination(): ReactNode {
  const settingsOpen = useShellStore((state) => state.profileSettingsOpen);
  const setProfileSettingsOpen = useShellStore((state) => state.setProfileSettingsOpen);
  const mobile = useMobileViewport();
  useLayer(PROFILE_SETTINGS_LAYER_ID, settingsOpen, setProfileSettingsOpen);

  return (
    <div
      className={cn(
        "layer-host min-h-0 flex-1",
        mobile ? "layer-host-mobile" : "layer-host-desktop",
      )}
      data-profile-destination=""
    >
      <div className="layer-chat-column min-h-0 min-w-0 flex-1">
        <SelfProfilePane />
        {settingsOpen ? (
          <div className="layer-overlay-stack" data-layer-column="overlay">
            <section
              className={cn("layer-frame", mobile ? "layer-frame-mobile" : "layer-frame-overlay")}
              data-layer="settings"
              data-layer-top="true"
            >
              <SettingsLayer onClose={() => setProfileSettingsOpen(false)} />
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
