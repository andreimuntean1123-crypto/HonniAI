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
  /** Renders Google's official sign-in button into the given element. */
  mountGoogleButton: (
    container: HTMLElement,
    options?: { theme?: 'light' | 'dark'; locale?: string },
  ) => Promise<boolean>;
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

/**
 * Loads Google Identity Services.
 *
 * The timeout matters: ad blockers, offline devices and networks that cannot
 * reach accounts.google.com leave the request hanging forever, and without a
 * deadline the sign-in area would stay empty with no explanation.
 */
function loadGoogleScript(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const ready = () =>
      Boolean((window as unknown as { google?: { accounts?: { id?: unknown } } }).google?.accounts?.id);
    if (ready()) return resolve();

    const deadline = window.setTimeout(() => reject(new Error('timeout')), timeoutMs);
    const done = (ok: boolean) => {
      window.clearTimeout(deadline);
      // `onload` can fire a tick before `window.google` is populated.
      if (ok && !ready()) {
        window.setTimeout(() => (ready() ? resolve() : reject(new Error('unavailable'))), 300);
        return;
      }
      ok ? resolve() : reject(new Error('script'));
    };

    const existing = document.getElementById('google-identity') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => done(true), { once: true });
      existing.addEventListener('error', () => done(false), { once: true });
      return;
    }

    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.id = 'google-identity';
    s.async = true;
    s.onload = () => done(true);
    s.onerror = () => done(false);
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

  /** Turns a Google ID token into a signed-in user. */
  const acceptGoogleCredential = useCallback(
    (credential: string) => {
      const payload = decodeJwtPayload(credential);
      if (!payload?.email) return false;
      persist({
        id: String(payload.sub ?? uid('google')),
        name: String(payload.name ?? payload.email),
        email: String(payload.email),
        picture: payload.picture ? String(payload.picture) : undefined,
        provider: 'google',
        createdAt: Date.now(),
      });
      return true;
    },
    [persist],
  );

  /**
   * Renders Google's own sign-in button into `container`.
   *
   * This is the reliable path: One Tap (`prompt()`) is silently suppressed by
   * browsers that block third-party cookies, or after the user dismisses it
   * once, which makes it useless as the only entry point. The rendered button
   * always opens the account chooser in a popup.
   */
  const mountGoogleButton = useCallback(
    async (
      container: HTMLElement,
      options: { theme?: 'light' | 'dark'; locale?: string } = {},
    ): Promise<boolean> => {
      if (!GOOGLE_CLIENT_ID) return false;
      try {
        await loadGoogleScript();
        const google = (window as unknown as { google?: any }).google;
        if (!google?.accounts?.id) return false;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: 'popup',
          auto_select: false,
          callback: (res: { credential?: string }) => {
            if (res.credential) acceptGoogleCredential(res.credential);
          },
        });

        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: options.theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: Math.min(360, Math.max(220, container.clientWidth || 320)),
          locale: options.locale ?? 'ro',
        });
        return true;
      } catch {
        return false;
      }
    },
    [acceptGoogleCredential],
  );

  const signInWithGoogle = useCallback(async () => {
    // Without a client ID configured there is nothing to sign in to, so the
    // demo account keeps the app usable — the caller tells the user.
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
          ux_mode: 'popup',
          auto_select: false,
          callback: (res: { credential?: string }) =>
            res.credential ? resolve(res.credential) : reject(new Error('no-credential')),
        });
        google.accounts.id.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            reject(new Error('dismissed'));
          }
        });
      });

      if (!acceptGoogleCredential(credential)) throw new Error('payload');
      return { ok: true };
    } catch {
      return { ok: false, error: 'google' };
    }
  }, [acceptGoogleCredential, signInDemo]);

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
      mountGoogleButton,
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
      mountGoogleButton,
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
