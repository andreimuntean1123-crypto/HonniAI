'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '@/lib/types';
import { readStore, removeStore, uid, writeStore } from '@/lib/storage';

/**
 * Authentication — email and password only.
 *
 * Two modes, chosen automatically:
 *
 *  - **Server accounts** (when a KV database is configured): registration and
 *    login go through `/api/auth/*`, the session lives in an httpOnly cookie
 *    and the account exists independently of the browser. This is what makes
 *    favorites and history follow the user across devices.
 *  - **Device accounts** (nothing configured): the same forms work, but the
 *    account and its data stay in this browser. `syncEnabled` is false, and the
 *    UI says so instead of implying the data is synced.
 *
 * The demo account is always local.
 */

type Credentials = { email: string; password: string; name?: string };
type Result = { ok: boolean; error?: 'invalid' | 'taken' | 'network' };

type AuthValue = {
  user: User | null;
  ready: boolean;
  /** True when accounts live on the server, so data can sync between devices. */
  syncEnabled: boolean;
  signInWithPassword: (c: Credentials) => Promise<Result>;
  signUpWithPassword: (c: Credentials) => Promise<Result>;
  signInDemo: () => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

type StoredAccount = { user: User; passwordHash: string };
type ServerUser = { id: string; name: string; email: string; picture?: string; createdAt: number };

/** SHA-256 — device accounts never store a plaintext password. */
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`honni:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const fromServer = (u: ServerUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  picture: u.picture,
  provider: 'password',
  createdAt: u.createdAt,
  synced: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [serverAuth, setServerAuth] = useState(false);

  // Ask the server whether accounts are hosted, and restore the session if so.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const local = readStore<User | null>('user', null);
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = (await res.json()) as { serverAuth: boolean; user: ServerUser | null };
        if (cancelled) return;

        setServerAuth(json.serverAuth);
        if (json.serverAuth) {
          // A local demo session stays valid; anything else follows the cookie.
          if (json.user) {
            const next = fromServer(json.user);
            setUser(next);
            writeStore('user', next);
          } else if (local?.provider === 'demo') {
            setUser(local);
          } else {
            setUser(null);
            removeStore('user');
          }
        } else {
          setUser(local);
        }
      } catch {
        // Offline: fall back to whatever this device already had.
        if (!cancelled) setUser(local);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) writeStore('user', next);
    else removeStore('user');
  }, []);

  const signInDemo = useCallback(() => {
    persist({
      id: 'demo-user',
      name: 'Demo',
      email: 'demo@honni.ai',
      provider: 'demo',
      createdAt: Date.now(),
    });
  }, [persist]);

  /* ------------------------------------------------------------ server mode */

  const serverRequest = useCallback(
    async (path: string, credentials: Credentials): Promise<Result> => {
      try {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        if (res.status === 409) return { ok: false, error: 'taken' };
        if (!res.ok) return { ok: false, error: 'invalid' };

        const json = (await res.json()) as { user: ServerUser };
        persist(fromServer(json.user));
        return { ok: true };
      } catch {
        return { ok: false, error: 'network' };
      }
    },
    [persist],
  );

  /* ------------------------------------------------------------ device mode */

  const localSignUp = useCallback(
    async ({ email, password, name }: Credentials): Promise<Result> => {
      const accounts = readStore<StoredAccount[]>('accounts', []);
      if (accounts.some((a) => a.user.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, error: 'taken' };
      }
      const account: StoredAccount = {
        user: {
          id: uid('user'),
          name: name?.trim() || email.split('@')[0],
          email,
          provider: 'password',
          createdAt: Date.now(),
        },
        passwordHash: await hashPassword(password),
      };
      writeStore('accounts', [...accounts, account]);
      persist(account.user);
      return { ok: true };
    },
    [persist],
  );

  const localSignIn = useCallback(
    async ({ email, password }: Credentials): Promise<Result> => {
      const accounts = readStore<StoredAccount[]>('accounts', []);
      const hash = await hashPassword(password);
      const found = accounts.find(
        (a) => a.user.email.toLowerCase() === email.toLowerCase() && a.passwordHash === hash,
      );
      if (!found) return { ok: false, error: 'invalid' };
      persist(found.user);
      return { ok: true };
    },
    [persist],
  );

  /* ------------------------------------------------------------------ api   */

  const signUpWithPassword = useCallback(
    (c: Credentials) =>
      serverAuth ? serverRequest('/api/auth/register', c) : localSignUp(c),
    [serverAuth, serverRequest, localSignUp],
  );

  const signInWithPassword = useCallback(
    (c: Credentials) => (serverAuth ? serverRequest('/api/auth/login', c) : localSignIn(c)),
    [serverAuth, serverRequest, localSignIn],
  );

  const signOut = useCallback(() => {
    persist(null);
    if (serverAuth) {
      void fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    }
  }, [persist, serverAuth]);

  const updateUser = useCallback(
    (patch: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        writeStore('user', next);

        if (serverAuth && next.synced) {
          void fetch('/api/auth/me', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: next.name, picture: next.picture }),
          }).catch(() => undefined);
        } else {
          // Device accounts keep their copy in the local account list.
          const accounts = readStore<StoredAccount[]>('accounts', []);
          const idx = accounts.findIndex((a) => a.user.id === next.id);
          if (idx >= 0) {
            accounts[idx] = { ...accounts[idx], user: next };
            writeStore('accounts', accounts);
          }
        }
        return next;
      });
    },
    [serverAuth],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      syncEnabled: serverAuth && Boolean(user?.synced),
      signInWithPassword,
      signUpWithPassword,
      signInDemo,
      signOut,
      updateUser,
    }),
    [
      user,
      ready,
      serverAuth,
      signInWithPassword,
      signUpWithPassword,
      signInDemo,
      signOut,
      updateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
