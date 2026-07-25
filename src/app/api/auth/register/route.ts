import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import {
  createSession,
  hashPassword,
  parseCredentials,
  sessionCookie,
  toPublicUser,
  type StoredUser,
} from '@/lib/server/auth';
import { keys, storeConfigured, storeDelete, storeSet, storeSetIfAbsent } from '@/lib/server/store';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Registration is a write endpoint — keep it behind the same limiter.
  const limit = rateLimit(`register:${clientIp(req)}`);
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  if (!storeConfigured) {
    // No database: the client keeps using its per-device account store.
    return NextResponse.json({ error: 'not_configured' }, { status: 501 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const credentials = parseCredentials(body);
  if (!credentials) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const id = `u_${randomBytes(9).toString('hex')}`;

  // Reserve the address first: SET NX makes concurrent sign-ups safe.
  const reserved = await storeSetIfAbsent(keys.emailIndex(credentials.email), id);
  if (!reserved) return NextResponse.json({ error: 'taken' }, { status: 409 });

  try {
    const user: StoredUser = {
      id,
      name: credentials.name || credentials.email.split('@')[0],
      email: credentials.email,
      passwordHash: await hashPassword(credentials.password),
      createdAt: Date.now(),
    };
    await storeSet(keys.user(id), user);

    const token = await createSession(id);
    const res = NextResponse.json({ user: toPublicUser(user) });
    res.cookies.set(sessionCookie(token));
    return res;
  } catch (error) {
    // Do not leave a dangling reservation if the account could not be written.
    await storeDelete(keys.emailIndex(credentials.email));
    console.error('[api/auth/register]', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
