import { useTranslation } from "react-i18next";
import logoDark from "@/assets/brand/logo_dark.png";
import logoLight from "@/assets/brand/logo_light.png";
import type { ResolvedTheme } from "@/shared/lib/theme";

export interface LogoProps {
  resolvedTheme: ResolvedTheme;
}

export function Logo({ resolvedTheme }: LogoProps) {
  const { t } = useTranslation();
  const src = resolvedTheme === "dark" ? logoLight : logoDark;
  return (
    <img
      src={src}
      alt={t("brand.logo_alt")}
      className="h-[var(--space-10)] w-[var(--space-10)] object-contain"
    />
  );
}
