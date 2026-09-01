import { lazy, Suspense } from "react";
import { loadCallOverlays } from "@/shared/lib/chunks";

void loadCallOverlays();

const CallOverlays = lazy(() => loadCallOverlays().then((mod) => ({ default: mod.CallOverlays })));

export function CallHost() {
  return (
    <Suspense fallback={null}>
      <CallOverlays />
    </Suspense>
  );
}
