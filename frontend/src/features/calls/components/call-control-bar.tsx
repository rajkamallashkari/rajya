import { useState } from "react";
import { Mic, MicOff, MonitorUp, PhoneOff, SwitchCamera, Video, VideoOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AudioDeviceMenu } from "@/features/calls/components/audio-device-menu";
import { SpeakerToggle } from "@/features/calls/components/speaker-toggle";
import { useCanFlipCamera } from "@/features/calls/hooks/use-can-flip-camera";
import {
  cancelCall,
  endCall,
  flipCamera,
  startScreenShare,
  stopScreenShare,
  toggleCamera,
  toggleMic,
} from "@/features/calls/lib";
import { DIRECT_PARTICIPANT_MAX } from "@/features/calls/model/constants";
import { useCallStore } from "@/features/calls/store/call-store";
import { usePressHold } from "@/shared/hooks/use-press-hold";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS } from "@/shared/ui/metrics";

const ROUND =
  "rounded-[var(--radius-full)] text-[var(--text-inverse)] hover:bg-[var(--call-chrome-strong)]";

export function CallControlBar({ showCameraFlip = false }: { showCameraFlip?: boolean }) {
  const { t } = useTranslation();
  const callType = useCallStore((state) => state.callType);
  const micOn = useCallStore((state) => state.micOn);
  const camOn = useCallStore((state) => state.camOn);
  const status = useCallStore((state) => state.status);
  const isScreenSharing = useCallStore((state) => state.isScreenSharing);
  const participants = useCallStore((state) => state.participants);
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false);
  const canFlip = useCanFlipCamera();
  const pressHold = usePressHold({
    onClick: () => toggleMic(),
    onHold: () => setDeviceMenuOpen(true),
  });
  const direct = participants.length <= DIRECT_PARTICIPANT_MAX;

  return (
    <div className="flex flex-wrap items-center justify-center gap-[var(--control-gap)] px-[var(--space-4)] pt-[var(--space-3)] pb-[max(var(--space-6),var(--safe-area-bottom))]">
      <AudioDeviceMenu onOpenChange={setDeviceMenuOpen} open={deviceMenuOpen}>
        <IconButton
          aria-label={micOn ? t("calls.mute") : t("calls.unmute")}
          aria-pressed={!micOn}
          className={cn(ROUND, micOn ? "bg-[var(--call-chrome)]" : "bg-[var(--status-danger)]")}
          type="button"
          variant="ghost"
          {...pressHold}
        >
          {micOn ? <Mic aria-hidden className={ICON_CLASS} /> : <MicOff aria-hidden className={ICON_CLASS} />}
        </IconButton>
      </AudioDeviceMenu>

      {callType === "video" ? (
        <IconButton
          aria-label={camOn ? t("calls.video_off") : t("calls.video_on")}
          aria-pressed={!camOn}
          className={cn(ROUND, camOn ? "bg-[var(--call-chrome)]" : "bg-[var(--status-danger)]")}
          onClick={() => toggleCamera()}
          type="button"
          variant="ghost"
        >
          {camOn ? <Video aria-hidden className={ICON_CLASS} /> : <VideoOff aria-hidden className={ICON_CLASS} />}
        </IconButton>
      ) : null}

      {showCameraFlip && callType === "video" && canFlip ? (
        <IconButton
          aria-label={t("calls.flip_camera")}
          className={cn(ROUND, "bg-[var(--call-chrome)]")}
          onClick={() => void flipCamera()}
          type="button"
          variant="ghost"
        >
          <SwitchCamera aria-hidden className={ICON_CLASS} />
        </IconButton>
      ) : null}

      {direct && status === "active" ? (
        <IconButton
          aria-label={isScreenSharing ? t("calls.screen_share_stop") : t("calls.screen_share_start")}
          aria-pressed={isScreenSharing}
          className={cn(ROUND, isScreenSharing ? "bg-[var(--status-danger)]" : "bg-[var(--call-chrome)]")}
          onClick={() => void (isScreenSharing ? stopScreenShare() : startScreenShare())}
          type="button"
          variant="ghost"
        >
          <MonitorUp aria-hidden className={ICON_CLASS} />
        </IconButton>
      ) : null}

      <SpeakerToggle />

      <IconButton
        aria-label={t("calls.end")}
        className="ml-[var(--space-2)] h-[var(--space-12)] w-[var(--space-12)] rounded-[var(--radius-full)] bg-[var(--status-danger)] text-[var(--text-inverse)] shadow-[var(--elevation-2)] hover:bg-[var(--status-danger-hover)]"
        onClick={() => {
          if (status === "ringing-outgoing") {
            void cancelCall();
            return;
          }
          void endCall();
        }}
        type="button"
        variant="danger"
      >
        <PhoneOff aria-hidden className="h-[var(--space-6)] w-[var(--space-6)]" />
      </IconButton>
    </div>
  );
}
