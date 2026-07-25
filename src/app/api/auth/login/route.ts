import { NextResponse } from 'next/server';
import {
  createSession,
  parseCredentials,
  sessionCookie,
  toPublicUser,
  verifyPassword,
  type StoredUser,
} from '@/lib/server/auth';
import { keys, storeConfigured, storeGet } from '@/lib/server/store';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limit = rateLimit(`login:${clientIp(req)}`);
  if (!limit.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  if (!storeConfigured) return NextResponse.json({ error: 'not_configured' }, { status: 501 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const credentials = parseCredentials(body);
  if (!credentials) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });

  const userId = await storeGet<string>(keys.emailIndex(credentials.email));
  const user = userId ? await storeGet<StoredUser>(keys.user(userId)) : null;

  // Same response for "unknown email" and "wrong password" — no account probing.
  if (!user || !(await verifyPassword(credentials.password, user.passwordHash))) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const token = await createSession(user.id);
  const res = NextResponse.json({ user: toPublicUser(user) });
  res.cookies.set(sessionCookie(token));
  return res;
}
