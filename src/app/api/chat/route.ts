import { NextResponse } from 'next/server';
import { buildSystemPrompt, isAgentId } from '@/lib/agents';
import { complete, aiConfigured, type AiMessage } from '@/lib/server/aiProvider';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';
import { demoChatReply } from '@/lib/demo';
import type { Locale } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Model calls routinely need more than the 10s a serverless function gets by
// default; without this the platform kills the request mid-generation.
export const maxDuration = 60;

const MAX_MESSAGES = 24;
const MAX_CHARS = 6000;
const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_MB ?? 8) * 1024 * 1024;

const isLocale = (v: unknown): v is Locale => v === 'ro' || v === 'ru' || v === 'en';

/** Validates and trims the payload — never trust the client. */
function parseBody(body: unknown) {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;

  if (!isAgentId(b.agent)) return null;
  if (!isLocale(b.locale)) return null;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return null;

  const messages: AiMessage[] = [];
  for (const raw of b.messages.slice(-MAX_MESSAGES)) {
    if (typeof raw !== 'object' || raw === null) return null;
    const m = raw as Record<string, unknown>;
    if (m.role !== 'user' && m.role !== 'assistant') return null;
    if (typeof m.content !== 'string') return null;

    let image: string | undefined;
    if (typeof m.image === 'string' && m.image.startsWith('data:image/')) {
      // base64 payload length ≈ 4/3 of the byte size
      if (m.image.length * 0.75 > MAX_IMAGE_BYTES) return null;
      image = m.image;
    }
    messages.push({ role: m.role, content: m.content.slice(0, MAX_CHARS), image });
  }

  const userContext =
    typeof b.userContext === 'string' ? b.userContext.slice(0, 1200) : undefined;

  return { agent: b.agent, locale: b.locale, messages, userContext };
}

export async function POST(req: Request) {
  const limit = rateLimit(`chat:${clientIp(req)}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter: limit.retryAfterSeconds },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const { agent, locale, messages, userContext } = parsed;

  // Demo mode: no key configured, still return a well-structured answer.
  if (!aiConfigured) {
    return NextResponse.json({ text: demoChatReply(agent, locale), demo: true });
  }

  try {
    const system = buildSystemPrompt(agent, locale, userContext);
    const result = await complete(system, messages, { maxTokens: 1600 });
    return NextResponse.json({ text: result?.text ?? '', demo: false });
  } catch (error) {
    console.error('[api/chat]', error);
    // Demo replies are for the unconfigured case only. When a real provider
    // call fails, say so instead of passing pre-written text off as an answer.
    return NextResponse.json({ error: 'provider_error' }, { status: 502 });
  }
}
