import { useEffect, useState } from "react";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";

const MIN_CAMERAS_FOR_FLIP = 2;

export function useCanFlipCamera(): boolean {
  const mobile = useMobileViewport();
  const [hasMultipleCams, setHasMultipleCams] = useState(false);

  useEffect(() => {
    if (!mobile) {
      setHasMultipleCams(false);
      return;
    }
    let cancelled = false;
    const probe = async () => {
      try {
        const devices = (await navigator.mediaDevices?.enumerateDevices?.()) ?? [];
        if (!cancelled) {
          setHasMultipleCams(devices.filter((device) => device.kind === "videoinput").length >= MIN_CAMERAS_FOR_FLIP);
        }
      } catch {
        if (!cancelled) {
          setHasMultipleCams(false);
        }
      }
    };
    void probe();
    navigator.mediaDevices?.addEventListener?.("devicechange", probe);
    return () => {
      cancelled = true;
      navigator.mediaDevices?.removeEventListener?.("devicechange", probe);
    };
  }, [mobile]);

  return mobile && hasMultipleCams;
}
