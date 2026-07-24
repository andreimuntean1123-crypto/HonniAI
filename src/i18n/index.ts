import type { Locale } from '@/lib/types';
import { ro, type Dict } from './ro';
import { ru } from './ru';
import { en } from './en';

export const LOCALES: Locale[] = ['ro', 'ru', 'en'];
export const DEFAULT_LOCALE: Locale = 'ro';

export const dictionaries: Record<Locale, Dict> = { ro, ru, en };

export type { Dict };

/** Dot-path into the dictionary, e.g. `nav.recipes`. */
export type TranslateKey = string;

/**
 * Resolves a dot-path with `{placeholder}` interpolation.
 * Falls back to Romanian, then to the key itself, so a missing string is
 * always visible during development instead of rendering "undefined".
 */
export function translate(
  locale: Locale,
  key: TranslateKey,
  vars?: Record<string, string | number>,
): string {
  const raw = lookup(dictionaries[locale], key) ?? lookup(dictionaries[DEFAULT_LOCALE], key);
  if (typeof raw !== 'string') return key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name) =>
    vars[name] !== undefined ? String(vars[name]) : m,
  );
}

function lookup(dict: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
      dict,
    );
}

export const isLocale = (v: unknown): v is Locale =>
  typeof v === 'string' && (LOCALES as string[]).includes(v);
