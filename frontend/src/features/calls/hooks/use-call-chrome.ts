import { useCallback, useEffect, useState } from "react";
import { CALL_CONTROLS_IDLE_MS } from "@/features/calls/model/constants";

export function useCallChrome(enabled: boolean) {
  const [visible, setVisible] = useState(enabled);

  useEffect(() => {
    setVisible(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !visible) {
      return;
    }
    const timer = window.setTimeout(() => setVisible(false), CALL_CONTROLS_IDLE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, visible]);

  const toggle = useCallback(() => setVisible((current) => !current), []);

  return { toggle, visible };
}
