import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { ThemeProvider } from "@/app/theme-provider";
import { createQueryClient } from "@/shared/lib/query/client";
import { useOutboxLifecycle } from "@/shared/lib/outbox/lifecycle";
import { usePushSubscription } from "@/features/auth/hooks/use-push-subscription";
import { Toaster } from "@/shared/ui/toast";
import { TooltipProvider } from "@/shared/ui/tooltip";

function OutboxBridge({ children }: { children: ReactNode }) {
  useOutboxLifecycle();
  usePushSubscription();
  return children;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <OutboxBridge>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
        </ThemeProvider>
      </OutboxBridge>
    </QueryClientProvider>
  );
}
