import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type Density = "confortavel" | "compacto";

export type Preferences = {
  mode: ThemeMode;
  density: Density;
  animations: boolean;
  sidebarWidth: number;
  hoverExpand: boolean;
};

const KEY = "fiscal.prefs.v1";

const defaults: Preferences = {
  mode: "system",
  density: "confortavel",
  animations: true,
  sidebarWidth: 270,
  hoverExpand: true,
};

type Ctx = Preferences & {
  resolved: "light" | "dark";
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  reset: () => void;
};

const PreferencesContext = createContext<Ctx | null>(null);

function readPrefs(): Preferences {
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...(JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Preferences) };
  } catch {
    return defaults;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs());
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" =
    prefs.mode === "system" ? (systemDark ? "dark" : "light") : prefs.mode;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.density = prefs.density;
  }, [resolved, prefs.density]);

  const set = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      window.localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    window.localStorage.setItem(KEY, JSON.stringify(defaults));
    setPrefs(defaults);
  }, []);

  const value = useMemo<Ctx>(() => ({ ...prefs, resolved, set, reset }), [prefs, resolved, set, reset]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences precisa estar dentro de PreferencesProvider.");
  return ctx;
}
