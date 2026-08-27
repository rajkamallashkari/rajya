import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, type Ref } from "react";
import { cn } from "@/shared/lib/cn";
import { CONTROL_DISABLED, FOCUS_RING, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const buttonVariants = cva(
  cn(
    "inline-flex min-h-[var(--control-height)] min-w-[var(--control-height)] items-center justify-center rounded-[var(--control-radius)] transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)] disabled:pointer-events-none",
    WEIGHT_EMPHASIS,
    CONTROL_DISABLED,
    FOCUS_RING,
  ),
  {
    variants: {
      variant: {
        primary: "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]",
        secondary:
          "border border-[var(--border-default)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
        ghost: "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
        danger:
          "bg-[var(--status-danger)] text-[var(--text-inverse)] hover:bg-[var(--status-danger-hover)]",
      },
      size: {
        sm: "px-[var(--control-pad-x-sm)] py-[var(--control-pad-y-sm)] text-[length:var(--text-sm)]",
        md: "px-[var(--control-pad-x)] py-[var(--control-pad-y)] text-[length:var(--text-md)]",
        lg: "px-[var(--control-pad-x-lg)] py-[var(--control-pad-y-lg)] text-[length:var(--text-lg)]",
        icon: "p-[var(--control-pad-y)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    />
  );
}

export { buttonVariants };
