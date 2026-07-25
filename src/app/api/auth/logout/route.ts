import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, destroySession, sessionCookie } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await destroySession(token);

  const res = NextResponse.json({ ok: true });
  // Expire the cookie as well, so a stale token is never sent again.
  res.cookies.set({ ...sessionCookie('', 0), value: '' });
  return res;
}
