import { useEffect, useState } from "react";
import { CALL_ELAPSED_TICK_MS } from "@/features/calls/model/constants";
import { useCallStore } from "@/features/calls/store/call-store";
import { MS_PER_SECOND } from "@/features/conversations/model/constants";

const PAD = 2;
const SECONDS_PER_MINUTE = 60;

export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / MS_PER_SECOND);
  const minutes = Math.floor(total / SECONDS_PER_MINUTE);
  const seconds = total % SECONDS_PER_MINUTE;
  return `${minutes.toString().padStart(PAD, "0")}:${seconds.toString().padStart(PAD, "0")}`;
}

export function useCallElapsed(): string {
  const startedAt = useCallStore((state) => state.startedAt);
  const status = useCallStore((state) => state.status);
  const [elapsed, setElapsed] = useState(formatElapsed(0));

  useEffect(() => {
    if (!startedAt || status !== "active") {
      setElapsed(formatElapsed(0));
      return;
    }
    const tick = () => setElapsed(formatElapsed(Date.now() - startedAt));
    tick();
    const id = setInterval(tick, CALL_ELAPSED_TICK_MS);
    return () => clearInterval(id);
  }, [startedAt, status]);

  return elapsed;
}
