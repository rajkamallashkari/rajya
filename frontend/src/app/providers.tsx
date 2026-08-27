import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { ThemeProvider } from "@/app/theme-provider";
import { createQueryClient } from "@/shared/lib/query/client";
import { Toaster } from "@/shared/ui/toast";
import { TooltipProvider } from "@/shared/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
