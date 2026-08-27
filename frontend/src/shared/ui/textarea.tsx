import { useLayoutEffect, useRef, type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import {
  CONTROL_DISABLED,
  CONTROL_SURFACE,
  FOCUS_RING,
  TEXTAREA_MIN_ROWS,
} from "@/shared/ui/metrics";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>;
}

function assignRef(
  ref: Ref<HTMLTextAreaElement> | undefined,
  node: HTMLTextAreaElement | null,
): void {
  if (typeof ref === "function") {
    ref(node);
    return;
  }
  if (ref) {
    ref.current = node;
  }
}

function resize(el: HTMLTextAreaElement): void {
  el.style.height = "auto";
  const maxPx = Number.parseFloat(getComputedStyle(el).maxHeight);
  const next = Number.isFinite(maxPx) ? Math.min(el.scrollHeight, maxPx) : el.scrollHeight;
  el.style.height = `${next}px`;
}

export function Textarea({
  className,
  ref,
  onInput,
  rows = TEXTAREA_MIN_ROWS,
  ...props
}: TextareaProps) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    if (innerRef.current) {
      resize(innerRef.current);
    }
  }, [props.value]);

  return (
    <textarea
      ref={(node) => {
        innerRef.current = node;
        assignRef(ref, node);
      }}
      rows={rows}
      className={cn(
        "block w-full max-h-[var(--textarea-max-height)] resize-none overflow-x-hidden overflow-y-auto px-[var(--control-pad-x-sm)] py-[var(--control-pad-y)]",
        CONTROL_SURFACE,
        FOCUS_RING,
        "placeholder:text-[var(--text-tertiary)]",
        CONTROL_DISABLED,
        className,
      )}
      onInput={(event) => {
        resize(event.currentTarget);
        onInput?.(event);
      }}
      {...props}
    />
  );
}
