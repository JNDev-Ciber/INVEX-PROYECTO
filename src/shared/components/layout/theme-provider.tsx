import * as React from "react";

/**
 * Provider de tema propio (reemplaza a next-themes, que renderiza un
 * <script> dentro de React y React 19 lo reporta como error en consola).
 * El script que evita el parpadeo al cargar vive en index.html.
 * Misma API que se usaba de next-themes: theme, setTheme, resolvedTheme.
 */

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  themes: Theme[];
  setTheme: (theme: Theme | string) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Solo se soporta "class" (agrega/quita .dark en <html>). */
  attribute?: "class";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const MEDIA = "(prefers-color-scheme: dark)";

function temaDelSistema(): ResolvedTheme {
  try {
    return window.matchMedia(MEDIA).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function leerGuardado(storageKey: string): Theme | null {
  try {
    const v = localStorage.getItem(storageKey);
    return v === "light" || v === "dark" || v === "system" ? v : null;
  } catch {
    return null;
  }
}

function aplicar(resolved: ResolvedTheme, sinTransicion: boolean) {
  const root = document.documentElement;
  let style: HTMLStyleElement | null = null;
  if (sinTransicion) {
    style = document.createElement("style");
    style.appendChild(document.createTextNode("*,*::before,*::after{transition:none!important}"));
    document.head.appendChild(style);
  }
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  if (style) {
    // Forzar reflow antes de devolver las transiciones.
    void window.getComputedStyle(document.body).opacity;
    const s = style;
    setTimeout(() => s.remove(), 1);
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  storageKey = "theme",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(
    () => leerGuardado(storageKey) ?? defaultTheme
  );
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(temaDelSistema);

  React.useEffect(() => {
    if (!enableSystem) return;
    const mql = window.matchMedia(MEDIA);
    const onChange = () => setSystemTheme(mql.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [enableSystem]);

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (enableSystem ? systemTheme : "light") : theme;

  React.useEffect(() => {
    aplicar(resolvedTheme, disableTransitionOnChange);
  }, [resolvedTheme, disableTransitionOnChange]);

  // Sincroniza entre pestañas.
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      setThemeState(leerGuardado(storageKey) ?? defaultTheme);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, defaultTheme]);

  const setTheme = React.useCallback(
    (next: Theme | string) => {
      if (next !== "light" && next !== "dark" && next !== "system") return;
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // sin storage: el tema dura hasta recargar
      }
      setThemeState(next);
    },
    [storageKey]
  );

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      systemTheme,
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
      setTheme,
    }),
    [theme, resolvedTheme, systemTheme, enableSystem, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme tiene que usarse dentro de ThemeProvider");
  return ctx;
}
