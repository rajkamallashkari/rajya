import { type ReactNode } from "react";
import { Button, type ButtonProps } from "@/shared/ui/button";

export interface IconButtonProps extends Omit<ButtonProps, "size" | "children"> {
  "aria-label": string;
  children: ReactNode;
}

export function IconButton({ variant = "ghost", ...props }: IconButtonProps) {
  return <Button {...props} variant={variant} size="icon" />;
}
