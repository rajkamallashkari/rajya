import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyTheme,
  defaultThemeInput,
  FALLBACK_RESOLVED_THEME,
  resolveTheme,
  type ApplyThemeInput,
  type ResolvedTheme,
} from "@/shared/lib/theme";

const ThemeContext = createContext<ResolvedTheme>(FALLBACK_RESOLVED_THEME);
const DEFAULT_INPUT = defaultThemeInput();

export function useResolvedTheme(): ResolvedTheme {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  input = DEFAULT_INPUT,
}: {
  children: ReactNode;
  input?: ApplyThemeInput;
}) {
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(input.theme, window.matchMedia.bind(window)),
  );

  const applied = useMemo(() => input, [input]);

  useEffect(() => {
    const next = applyTheme(applied, document, window.localStorage, window.matchMedia.bind(window));
    setResolved(next);

    if (applied.theme !== "system") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const updated = applyTheme(
        applied,
        document,
        window.localStorage,
        window.matchMedia.bind(window),
      );
      setResolved(updated);
    };
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [applied]);

  return <ThemeContext.Provider value={resolved}>{children}</ThemeContext.Provider>;
}
