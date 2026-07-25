import { readStore, removeStore, writeStore } from '@/lib/storage';

/**
 * "Bring your own key" support.
 *
 * The key is kept in this browser only:
 *  - stored under its own storage entry, deliberately OUTSIDE the synced
 *    account document, so it is never uploaded to the server with favorites
 *    and history;
 *  - sent per request as a header, used to call the provider and then dropped —
 *    the server never writes it anywhere;
 *  - shown masked, and removable at any time.
 */

const STORAGE_KEY = 'apiKey';

export type ApiKeyInfo = { key: string; provider: 'anthropic' | 'openai' };

/** Anthropic keys start with `sk-ant-`, OpenAI-compatible ones with `sk-`. */
export function detectProvider(key: string): ApiKeyInfo['provider'] | null {
  const value = key.trim();
  if (/^sk-ant-[A-Za-z0-9\-_]{20,}$/.test(value)) return 'anthropic';
  if (/^sk-[A-Za-z0-9\-_]{20,}$/.test(value)) return 'openai';
  return null;
}

export function readApiKey(): string | null {
  const value = readStore<string | null>(STORAGE_KEY, null);
  return value && detectProvider(value) ? value : null;
}

export function saveApiKey(key: string): boolean {
  const value = key.trim();
  if (!detectProvider(value)) return false;
  writeStore(STORAGE_KEY, value);
  return true;
}

export function clearApiKey(): void {
  removeStore(STORAGE_KEY);
}

/** `sk-ant-…4f2a` — enough to recognise the key without revealing it. */
export function maskApiKey(key: string): string {
  const head = key.slice(0, 7);
  const tail = key.slice(-4);
  return `${head}…${tail}`;
}

/** Header used by every AI route; empty object when no personal key is set. */
export function apiKeyHeader(): Record<string, string> {
  const key = readApiKey();
  return key ? { 'x-honni-api-key': key } : {};
}
