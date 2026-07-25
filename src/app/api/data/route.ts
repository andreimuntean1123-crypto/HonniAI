import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, readSession } from '@/lib/server/auth';
import { keys, storeConfigured, storeGet, storeSet } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The whole user document (profile, favorites, plans, history, shopping list)
 * is stored as one JSON blob per account. That is what makes the same data
 * appear on every device the user signs in from.
 *
 * Conflicts are resolved by `updatedAt` (last write wins). The client only
 * pushes when its copy is newer, so opening a second device does not wipe what
 * the first one saved.
 */

const MAX_BYTES = 1_000_000; // ~1 MB per account

type StoredDocument = { updatedAt: number; data: unknown };

async function requireUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSession(token);
}

export async function GET() {
  if (!storeConfigured) return NextResponse.json({ synced: false, document: null });

  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const document = await storeGet<StoredDocument>(keys.data(user.id));
  return NextResponse.json({ synced: true, document });
}

export async function PUT(req: Request) {
  if (!storeConfigured) return NextResponse.json({ synced: false }, { status: 501 });

  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.data !== 'object' || b.data === null) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const serialized = JSON.stringify(b.data);
  if (serialized.length > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }

  const incomingUpdatedAt =
    typeof b.updatedAt === 'number' && Number.isFinite(b.updatedAt) ? b.updatedAt : Date.now();

  const existing = await storeGet<StoredDocument>(keys.data(user.id));
  if (existing && existing.updatedAt > incomingUpdatedAt) {
    // Another device saved something newer — hand it back instead of overwriting.
    return NextResponse.json({ synced: true, conflict: true, document: existing });
  }

  const document: StoredDocument = { updatedAt: incomingUpdatedAt, data: b.data };
  await storeSet(keys.data(user.id), document);
  return NextResponse.json({ synced: true, updatedAt: document.updatedAt });
}

/** Used by "delete my account data" in Settings. */
export async function DELETE() {
  if (!storeConfigured) return NextResponse.json({ synced: false });

  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await storeSet(keys.data(user.id), { updatedAt: Date.now(), data: null });
  return NextResponse.json({ ok: true });
}
