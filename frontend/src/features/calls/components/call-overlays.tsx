import { useEffect } from "react";
import { FloatingVideoOverlay } from "@/features/calls/components/floating-video-overlay";
import { IncomingCallBanner } from "@/features/calls/components/incoming-call-banner";
import { RemoteAudioSink } from "@/features/calls/components/remote-audio-sink";
import { VideoCallView } from "@/features/calls/components/video-call-view";
import { VoiceCallView } from "@/features/calls/components/voice-call-view";
import { useCallStore } from "@/features/calls/store/call-store";
import { showToast } from "@/shared/ui/toast";

export function CallOverlays() {
  const error = useCallStore((state) => state.error);
  const setError = useCallStore((state) => state.setError);

  useEffect(() => {
    if (!error) {
      return;
    }
    showToast({ title: error, variant: "danger" });
    setError(null);
  }, [error, setError]);

  return (
    <div className="contents" data-call-overlays="">
      <IncomingCallBanner />
      <VoiceCallView />
      <VideoCallView />
      <FloatingVideoOverlay />
      <RemoteAudioSink />
    </div>
  );
}
