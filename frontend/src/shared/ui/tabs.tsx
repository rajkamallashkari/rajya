import * as TabsPrimitive from "@radix-ui/react-tabs";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { CONTROL_DISABLED, FOCUS_RING } from "@/shared/ui/metrics";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex min-h-[var(--control-height)] items-center gap-[var(--space-1)] rounded-[var(--control-radius)] bg-[var(--surface-hover)] p-[var(--space-1)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex min-h-[var(--control-height)] items-center justify-center rounded-[var(--radius-sm)] px-[var(--control-pad-x-sm)] text-[var(--text-secondary)] data-[state=active]:bg-[var(--surface-panel)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--elevation-1)]",
        CONTROL_DISABLED,
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content className={cn("pt-[var(--control-pad-x)]", className)} {...props} />
  );
}
