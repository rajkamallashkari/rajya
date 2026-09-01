import { lazy, Suspense } from "react";
import { ChunkFallback } from "@/shared/ui/chunk-fallback";
import { loadSettingsPanel } from "@/shared/lib/chunks";

void loadSettingsPanel();

const SettingsPanel = lazy(() =>
  loadSettingsPanel().then((mod) => ({ default: mod.SettingsPanel })),
);

export function SettingsLayer() {
  return (
    <Suspense fallback={<ChunkFallback />}>
      <SettingsPanel />
    </Suspense>
  );
}
