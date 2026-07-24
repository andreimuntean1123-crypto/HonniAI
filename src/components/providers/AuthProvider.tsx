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
 * Authentication.
 *
 * Ships with a self-contained local provider so the whole app is usable with
 * zero configuration (demo mode). Google Sign-In is real and activates as soon
 * as NEXT_PUBLIC_GOOGLE_CLIENT_ID is set — the Google Identity Services script
 * is loaded on demand and the returned ID token is decoded client-side.
 *
 * To move to a hosted backend (Firebase / Supabase), replace the three
 * `signIn*` implementations below; the rest of the app only depends on the
 * `User` shape exposed here.
 */

type Credentials = { email: string; password: string; name?: string };

type AuthValue = {
  user: User | null;
  ready: boolean;
  googleEnabled: boolean;
  signInWithGoogle: () => Promise<{ ok: boolean; fallback?: boolean; error?: string }>;
  signInWithPassword: (c: Credentials) => Promise<{ ok: boolean; error?: string }>;
  signUpWithPassword: (c: Credentials) => Promise<{ ok: boolean; error?: string }>;
  signInDemo: () => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

type StoredAccount = { user: User; passwordHash: string };

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

/** SHA-256 hash — local accounts never store a plaintext password. */
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`honni:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-identity')) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.id = 'google-identity';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('script'));
    document.head.appendChild(s);
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readStore<User | null>('user', null));
    setReady(true);
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

  const signInWithGoogle = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      signInDemo();
      return { ok: true, fallback: true };
    }
    try {
      await loadGoogleScript();
      const google = (window as unknown as { google?: any }).google;
      if (!google?.accounts?.id) throw new Error('gsi');

      const credential = await new Promise<string>((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res: { credential?: string }) =>
            res.credential ? resolve(res.credential) : reject(new Error('no-credential')),
        });
        google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            reject(new Error('dismissed'));
          }
        });
      });

      const payload = decodeJwtPayload(credential);
      if (!payload?.email) throw new Error('payload');

      persist({
        id: String(payload.sub ?? uid('google')),
        name: String(payload.name ?? payload.email),
        email: String(payload.email),
        picture: payload.picture ? String(payload.picture) : undefined,
        provider: 'google',
        createdAt: Date.now(),
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'google' };
    }
  }, [persist, signInDemo]);

  const signUpWithPassword = useCallback(
    async ({ email, password, name }: Credentials) => {
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

  const signInWithPassword = useCallback(
    async ({ email, password }: Credentials) => {
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

  const signOut = useCallback(() => persist(null), [persist]);

  const updateUser = useCallback(
    (patch: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        writeStore('user', next);
        // keep the local account list in sync for password accounts
        const accounts = readStore<StoredAccount[]>('accounts', []);
        const idx = accounts.findIndex((a) => a.user.id === next.id);
        if (idx >= 0) {
          accounts[idx] = { ...accounts[idx], user: next };
          writeStore('accounts', accounts);
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      googleEnabled: Boolean(GOOGLE_CLIENT_ID),
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      signInDemo,
      signOut,
      updateUser,
    }),
    [
      user,
      ready,
      signInWithGoogle,
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
