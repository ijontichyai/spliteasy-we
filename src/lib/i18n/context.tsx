import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, isLocale, translate, type Locale, type MessageKey } from "./dictionaries";

const STORAGE_KEY = "spliteasy.locale";

type I18n = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) setLocaleState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);
  const t = useCallback<I18n["t"]>((key, vars) => translate(locale, key, vars), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
