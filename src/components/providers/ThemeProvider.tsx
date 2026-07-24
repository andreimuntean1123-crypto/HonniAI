'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeMode } from '@/lib/types';
import { readStore, writeStore } from '@/lib/storage';

type ThemeValue = {
  mode: ThemeMode;
  /** The theme actually applied right now. */
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  // Apply the stored preference after hydration (the inline script in
  // layout.tsx already painted the correct class to avoid a flash).
  useEffect(() => {
    const stored = readStore<ThemeMode | null>('theme', null);
    if (stored) setModeState(stored);
  }, []);

  useEffect(() => {
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
      document.documentElement.classList.toggle('dark', dark);
      setResolved(dark ? 'dark' : 'light');
    };
    apply();

    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    writeStore('theme', m);
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setMode]);

  const value = useMemo(() => ({ mode, resolved, setMode, toggle }), [mode, resolved, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
