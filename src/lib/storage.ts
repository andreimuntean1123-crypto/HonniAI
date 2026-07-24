import { brand } from '@/config/brand';

/** Namespaced, SSR-safe localStorage helpers. */

const key = (name: string) => `${brand.storagePrefix}.${name}`;

export function readStore<T>(name: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key(name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(name: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    /* quota exceeded or private mode — the app keeps working in memory */
  }
}

export function removeStore(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key(name));
  } catch {
    /* ignore */
  }
}

/** Clears every key that belongs to this app (used by "delete my data"). */
export function clearAllStores(): void {
  if (typeof window === 'undefined') return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(brand.storagePrefix)) doomed.push(k);
    }
    doomed.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Short, collision-safe id for client-generated entities. */
export function uid(prefix = 'id'): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}
