import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  FALLBACK_RESOLVED_THEME,
  readThemeCache,
  resolveAppearance,
  resolveTheme,
  type ApplyThemeInput,
  type ResolvedTheme,
} from "@/shared/lib/theme";

export interface ThemeControls {
  input: ApplyThemeInput;
  resolved: ResolvedTheme;
  setInput: (patch: Partial<ApplyThemeInput>) => void;
}

const ThemeContext = createContext<ThemeControls | null>(null);

export function useResolvedTheme(): ResolvedTheme {
  return useContext(ThemeContext)?.resolved ?? FALLBACK_RESOLVED_THEME;
}

export function useThemeControls(): ThemeControls {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeControls requires ThemeProvider");
  }
  return ctx;
}

export function ThemeProvider({
  children,
  input: inputProp,
}: {
  children: ReactNode;
  input?: ApplyThemeInput;
}) {
  const [input, setInputState] = useState<ApplyThemeInput>(
    () => inputProp ?? readThemeCache(window.localStorage),
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(input.theme, window.matchMedia.bind(window)),
  );

  useEffect(() => {
    if (inputProp) {
      setInputState(inputProp);
    }
  }, [inputProp]);

  const setInput = useCallback((patch: Partial<ApplyThemeInput>): void => {
    setInputState((prev) => {
      const previous = resolveAppearance(prev.appearance);
      return {
        ...prev,
        ...patch,
        adminOverrides: patch.adminOverrides ?? prev.adminOverrides,
        appearance: patch.appearance
          ? {
              ...previous,
              ...patch.appearance,
              wallpaper: { ...previous.wallpaper, ...patch.appearance.wallpaper },
            }
          : prev.appearance,
        sliders: { ...prev.sliders, ...patch.sliders },
      };
    });
  }, []);

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

  const value = useMemo(
    () => ({ input: applied, resolved, setInput }),
    [applied, resolved, setInput],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
