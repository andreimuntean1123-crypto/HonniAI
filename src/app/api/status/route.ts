import { NextResponse } from 'next/server';
import { aiConfigured } from '@/lib/server/aiProvider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Lets the UI show whether it is running against a real provider or in demo mode. */
export async function GET() {
  return NextResponse.json({
    aiConfigured,
    maxImageMb: Number(process.env.MAX_IMAGE_MB ?? 8),
  });
}
