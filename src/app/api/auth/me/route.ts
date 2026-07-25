import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  readSession,
  toPublicUser,
  type StoredUser,
} from '@/lib/server/auth';
import { keys, storeConfigured, storeSet } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Restores the session on page load, and reports whether sync is available. */
export async function GET() {
  if (!storeConfigured) {
    return NextResponse.json({ serverAuth: false, user: null });
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await readSession(token);
  return NextResponse.json({ serverAuth: true, user: user ? toPublicUser(user) : null });
}

/** Updates the display name / picture of the signed-in account. */
export async function PATCH(req: Request) {
  if (!storeConfigured) return NextResponse.json({ error: 'not_configured' }, { status: 501 });

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await readSession(token);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const next: StoredUser = {
    ...user,
    name: typeof b.name === 'string' && b.name.trim() ? b.name.trim().slice(0, 60) : user.name,
    // Pictures are data URLs from the profile page; cap them so a large upload
    // cannot bloat the stored record.
    picture:
      typeof b.picture === 'string' && b.picture.length < 400_000 ? b.picture : user.picture,
  };

  await storeSet(keys.user(user.id), next);
  return NextResponse.json({ user: toPublicUser(next) });
}
