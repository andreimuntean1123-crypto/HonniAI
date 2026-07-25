/**
 * Server-side key/value storage.
 *
 * Cross-device sync needs data that lives outside the browser, so accounts,
 * sessions and user data are stored here rather than in localStorage.
 *
 * Driver selection, in order:
 *  1. Upstash / Vercel KV over REST (no dependency, works on serverless) —
 *     enabled automatically as soon as the connection env vars exist.
 *  2. An in-memory map, used in local development and whenever nothing is
 *     configured. It is per-instance and disappears on restart, which is why
 *     `storeConfigured` is exported: the app degrades to per-device accounts
 *     instead of pretending to sync.
 */

const KV_URL =
  process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim() || '';
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || '';

export const storeConfigured = Boolean(KV_URL && KV_TOKEN);

/** Fallback used when no KV is configured (development, or unconfigured deploys). */
const memory = new Map<string, { value: string; expiresAt: number | null }>();

async function kv(command: unknown[]): Promise<unknown> {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${KV_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`KV error ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  }
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`KV error: ${json.error}`);
  return json.result ?? null;
}

export async function storeGet<T>(key: string): Promise<T | null> {
  if (storeConfigured) {
    const raw = (await kv(['GET', key])) as string | null;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return null;
  }
}

export async function storeSet(
  key: string,
  value: unknown,
  options: { ttlSeconds?: number } = {},
): Promise<void> {
  const payload = JSON.stringify(value);
  if (storeConfigured) {
    await kv(
      options.ttlSeconds
        ? ['SET', key, payload, 'EX', String(options.ttlSeconds)]
        : ['SET', key, payload],
    );
    return;
  }
  memory.set(key, {
    value: payload,
    expiresAt: options.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : null,
  });
}

export async function storeDelete(key: string): Promise<void> {
  if (storeConfigured) {
    await kv(['DEL', key]);
    return;
  }
  memory.delete(key);
}

/** Sets a key only if it does not exist yet — used to reserve an email address. */
export async function storeSetIfAbsent(key: string, value: unknown): Promise<boolean> {
  const payload = JSON.stringify(value);
  if (storeConfigured) {
    const result = await kv(['SET', key, payload, 'NX']);
    return result !== null;
  }
  if (memory.has(key)) return false;
  memory.set(key, { value: payload, expiresAt: null });
  return true;
}

/* -------------------------------------------------------------------------- */
/* Key helpers — one place to see the whole layout                             */
/* -------------------------------------------------------------------------- */

export const keys = {
  emailIndex: (email: string) => `honni:email:${email.trim().toLowerCase()}`,
  user: (id: string) => `honni:user:${id}`,
  session: (token: string) => `honni:session:${token}`,
  data: (userId: string) => `honni:data:${userId}`,
};
