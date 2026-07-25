import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { keys, storeDelete, storeGet, storeSet } from './store';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = 'honni_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  picture?: string;
  passwordHash: string;
  createdAt: number;
};

/** Public shape sent to the browser — never includes the password hash. */
export type PublicUser = Omit<StoredUser, 'passwordHash'>;

export const toPublicUser = ({ passwordHash: _hash, ...rest }: StoredUser): PublicUser => rest;

/* -------------------------------------------------------------------------- */
/* Passwords                                                                   */
/* -------------------------------------------------------------------------- */

/** scrypt with a per-user random salt; stored as `salt:hash`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  // Constant-time comparison; lengths must match before comparing.
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Sessions are opaque random tokens stored server-side, so no signing secret is
 * needed and signing out actually invalidates the session everywhere.
 */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await storeSet(keys.session(token), { userId, createdAt: Date.now() }, {
    ttlSeconds: SESSION_TTL_SECONDS,
  });
  return token;
}

export async function readSession(token: string | undefined): Promise<StoredUser | null> {
  if (!token) return null;
  const session = await storeGet<{ userId: string }>(keys.session(token));
  if (!session?.userId) return null;
  return storeGet<StoredUser>(keys.user(session.userId));
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await storeDelete(keys.session(token));
}

export function sessionCookie(token: string, maxAge = SESSION_TTL_SECONDS) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;

export type Credentials = { email: string; password: string; name?: string };

export function parseCredentials(body: unknown): Credentials | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const password = typeof b.password === 'string' ? b.password : '';
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 60) : undefined;

  if (!EMAIL_RE.test(email) || email.length > 254) return null;
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 200) return null;
  return { email, password, name };
}
