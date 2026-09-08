import { lazy, Suspense, type ReactNode } from "react";
import { ChunkFallback } from "@/shared/ui/chunk-fallback";
import { loadBotBuilderForm } from "@/shared/lib/chunks";

void loadBotBuilderForm();

const BotBuilderForm = lazy(() =>
  loadBotBuilderForm().then((mod) => ({ default: mod.BotBuilderForm })),
);

export function BotsPanel(): ReactNode {
  return (
    <div data-bots-panel="">
      <Suspense fallback={<ChunkFallback />}>
        <BotBuilderForm />
      </Suspense>
    </div>
  );
}
