/**
 * Server-only AI access.
 *
 * The API key never leaves the server: every browser request goes to a route
 * handler in `src/app/api/*`, which calls this module.
 *
 * Priority: Anthropic → OpenAI-compatible → demo mode.
 */

export type AiMessage = {
  role: 'user' | 'assistant';
  content: string;
  /** data URL of an attached image (user messages only). */
  image?: string;
};

export type AiResult = { text: string; demo: boolean };

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY?.trim();
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-5';
const ANTHROPIC_VISION_MODEL =
  process.env.ANTHROPIC_VISION_MODEL?.trim() || ANTHROPIC_MODEL;

const OPENAI_KEY = process.env.OPENAI_API_KEY?.trim();
const OPENAI_BASE = process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

export const aiConfigured = Boolean(ANTHROPIC_KEY || OPENAI_KEY);

export class AiError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

/** Splits a data URL into the pieces the provider APIs expect. */
function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } | null {
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  return { mediaType: m[1] === 'image/jpg' ? 'image/jpeg' : m[1], base64: m[2] };
}

async function callAnthropic(
  system: string,
  messages: AiMessage[],
  maxTokens: number,
  hasImage: boolean,
): Promise<string> {
  const body = {
    model: hasImage ? ANTHROPIC_VISION_MODEL : ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => {
      const img = m.image ? parseDataUrl(m.image) : null;
      if (m.role === 'user' && img) {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
            },
            { type: 'text', text: m.content || ' ' },
          ],
        };
      }
      return { role: m.role, content: m.content || ' ' };
    }),
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_KEY as string,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AiError(`Anthropic error ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }

  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (json.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('\n')
    .trim();
  if (!text) throw new AiError('Empty answer from provider');
  return text;
}

async function callOpenAi(
  system: string,
  messages: AiMessage[],
  maxTokens: number,
): Promise<string> {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) =>
          m.role === 'user' && m.image
            ? {
                role: 'user',
                content: [
                  { type: 'text', text: m.content || ' ' },
                  { type: 'image_url', image_url: { url: m.image } },
                ],
              }
            : { role: m.role, content: m.content || ' ' },
        ),
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AiError(`OpenAI error ${res.status}: ${detail.slice(0, 300)}`, res.status);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AiError('Empty answer from provider');
  return text;
}

/**
 * Runs a completion. Returns `demo: true` when no provider is configured, so
 * the caller can fall back to the bundled demo content.
 */
export async function complete(
  system: string,
  messages: AiMessage[],
  options: { maxTokens?: number } = {},
): Promise<AiResult | null> {
  if (!aiConfigured) return null;
  const maxTokens = options.maxTokens ?? 1400;
  const hasImage = messages.some((m) => Boolean(m.image));

  if (ANTHROPIC_KEY) {
    return { text: await callAnthropic(system, messages, maxTokens, hasImage), demo: false };
  }
  return { text: await callOpenAi(system, messages, maxTokens), demo: false };
}

/** Extracts the first JSON object from a model answer (handles ```json fences). */
export function extractJson<T>(text: string): T | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
