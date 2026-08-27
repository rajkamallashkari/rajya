import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS, TOAST_DURATION_MS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export type ToastVariant = "default" | "danger";

export interface ToastPayload {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastRecord extends ToastPayload {
  id: number;
}

let nextId = 0;
let current: ToastRecord | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

export function showToast(payload: ToastPayload): void {
  nextId += 1;
  current = { ...payload, id: nextId };
  emit();
}

export function dismissToast(): void {
  current = null;
  emit();
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToast(): ToastRecord | null {
  return current;
}

function useToastRecord(): ToastRecord | null {
  const [record, setRecord] = useState<ToastRecord | null>(current);
  useEffect(() => subscribeToasts(() => setRecord(current)), []);
  return record;
}

export function Toaster({ children }: { children?: ReactNode }) {
  const record = useToastRecord();
  const { t } = useTranslation();
  const open = record !== null;

  return (
    <ToastPrimitive.Provider duration={TOAST_DURATION_MS}>
      {children}
      {record ? (
        <ToastPrimitive.Root
          key={record.id}
          open={open}
          onOpenChange={(next) => {
            if (!next) {
              dismissToast();
            }
          }}
          className={cn(
            "relative rounded-[var(--control-radius)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-[var(--control-pad-x)] text-[var(--text-primary)] shadow-[var(--elevation-2)] ui-popover",
            record.variant === "danger" ? "border-[var(--status-danger)]" : null,
          )}
        >
          <ToastPrimitive.Title className={WEIGHT_EMPHASIS}>{record.title}</ToastPrimitive.Title>
          {record.description ? (
            <ToastPrimitive.Description className="text-[var(--text-secondary)]">
              {record.description}
            </ToastPrimitive.Description>
          ) : null}
          <ToastPrimitive.Close asChild>
            <IconButton
              aria-label={t("ui.close")}
              className="absolute top-[var(--space-2)] right-[var(--space-2)]"
            >
              <X className={ICON_CLASS} />
            </IconButton>
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ) : null}
      <ToastPrimitive.Viewport className="fixed right-[var(--space-4)] bottom-[var(--safe-area-bottom)] z-[var(--z-toast)] flex w-[min(var(--toast-width),calc(100%-var(--space-8)))] max-w-[calc(100%-var(--space-8))] flex-col gap-[var(--control-gap-tight)] p-[var(--control-pad-x)]" />
    </ToastPrimitive.Provider>
  );
}
