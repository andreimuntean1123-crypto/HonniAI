'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/types';
import { DEFAULT_LOCALE, LOCALES, translate } from '@/i18n';
import { readStore, writeStore } from '@/lib/storage';

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locales: Locale[];
  ready: boolean;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Always start from the default locale so server and first client render match;
  // the stored/browser locale is applied right after hydration.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Romanian is the product default; the browser language is never used to
    // override it silently — only an explicit choice (stored here) wins.
    const stored = readStore<Locale | null>('locale', null);
    if (stored && LOCALES.includes(stored)) setLocaleState(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    writeStore('locale', l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t, locales: LOCALES, ready }),
    [locale, setLocale, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

/** Convenience hook for components that only need the translate function. */
export function useT() {
  return useI18n().t;
}
