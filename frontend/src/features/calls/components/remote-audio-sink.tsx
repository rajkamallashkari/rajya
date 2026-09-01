import { useEffect, useRef } from "react";
import { applyAudioOutputToElement } from "@/features/calls/lib";
import { bindAudioElement } from "@/features/calls/lib/bind-media";
import { useCallStore } from "@/features/calls/store/call-store";

export function RemoteAudioSink() {
  const remoteStreams = useCallStore((state) => state.remoteStreams);
  const speakerVolume = useCallStore((state) => state.speakerVolume);
  const refs = useRef<Record<number, HTMLAudioElement | null>>({});

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([id, stream]) => {
      bindAudioElement(refs.current[Number(id)]!, stream, speakerVolume, (el) => {
        void applyAudioOutputToElement(el);
      });
    });
  }, [remoteStreams, speakerVolume]);

  return (
    <div aria-hidden className="sr-only">
      {Object.keys(remoteStreams).map((id) => {
        const accountId = Number(id);
        return (
          <audio
            autoPlay
            data-call-audio=""
            key={accountId}
            playsInline
            ref={(el) => {
              refs.current[accountId] = el;
            }}
          />
        );
      })}
    </div>
  );
}
