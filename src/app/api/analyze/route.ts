import { NextResponse } from 'next/server';
import { complete, aiConfigured, extractJson } from '@/lib/server/aiProvider';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';
import { demoAnalysis } from '@/lib/demo';
import { healthScore } from '@/lib/nutrition';
import type { Locale, PhotoAnalysis } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGE_MB = Number(process.env.MAX_IMAGE_MB ?? 8);
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const isLocale = (v: unknown): v is Locale => v === 'ro' || v === 'ru' || v === 'en';

const LANGUAGE: Record<Locale, string> = {
  ro: 'Romanian',
  ru: 'Russian',
  en: 'English',
};

const SYSTEM = (locale: Locale) => `You analyse photos of food and drinks for Honni AI.

Return ONLY a JSON object, no prose, no code fences, with exactly these keys:
{
  "dish": string,                 // the dish name, in ${LANGUAGE[locale]}
  "kind": "food" | "drink" | "unknown",
  "confidence": number,           // 0..1, be honest: blurry or ambiguous photo => below 0.5
  "portion": string,              // approximate portion, e.g. "about 350 g"
  "ingredients": string[],        // visible / probable ingredients, max 10
  "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number, "sugar": number, "salt": number, "fiber": number },
  "benefits": string[],           // max 4
  "watchOuts": string[],          // max 4
  "frequency": string,            // how often it could reasonably be eaten
  "problematic": string[],        // ingredients that are common allergens or otherwise worth flagging
  "healthierSuggestions": string[], // max 4 concrete swaps
  "healthScore": number,          // 0..100, indicative only
  "summary": string               // 2 sentences maximum
}

Rules:
- Every string must be written in ${LANGUAGE[locale]}.
- All nutrition values are for the WHOLE visible portion, in grams (salt in grams too), and are estimates.
- If the image is unclear, or is not food, set kind to "unknown", confidence below 0.35, and say so in "summary" instead of inventing details.
- Never give a medical diagnosis and never claim certainty about ingredients you cannot see.`;

type ModelAnalysis = Omit<PhotoAnalysis, 'id' | 'createdAt' | 'demo' | 'thumbnail'>;

const clampNumber = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;

const stringList = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max) : [];

/** Normalizes whatever the model returned into a safe PhotoAnalysis. */
function normalize(raw: Partial<ModelAnalysis> & Record<string, unknown>): ModelAnalysis {
  const n = (raw.nutrition ?? {}) as Record<string, unknown>;
  const nutrition = {
    calories: clampNumber(n.calories, 0, 5000, 0),
    protein: clampNumber(n.protein, 0, 300, 0),
    carbs: clampNumber(n.carbs, 0, 500, 0),
    fat: clampNumber(n.fat, 0, 300, 0),
    sugar: clampNumber(n.sugar, 0, 300, 0),
    salt: clampNumber(n.salt, 0, 50, 0),
    fiber: clampNumber(n.fiber, 0, 100, 0),
  };

  const kind = raw.kind === 'drink' || raw.kind === 'unknown' ? raw.kind : 'food';

  return {
    dish: typeof raw.dish === 'string' ? raw.dish.slice(0, 120) : '—',
    kind,
    confidence: clampNumber(raw.confidence, 0, 1, 0.4),
    portion: typeof raw.portion === 'string' ? raw.portion.slice(0, 80) : '',
    ingredients: stringList(raw.ingredients, 10),
    nutrition,
    healthScore: Math.round(
      clampNumber(raw.healthScore, 0, 100, healthScore(nutrition)),
    ),
    benefits: stringList(raw.benefits, 4),
    watchOuts: stringList(raw.watchOuts, 4),
    frequency: typeof raw.frequency === 'string' ? raw.frequency.slice(0, 200) : '',
    problematic: stringList(raw.problematic, 6),
    healthierSuggestions: stringList(raw.healthierSuggestions, 4),
    summary: typeof raw.summary === 'string' ? raw.summary.slice(0, 400) : '',
  };
}

export async function POST(req: Request) {
  const limit = rateLimit(`analyze:${clientIp(req)}`);
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

  const b = (body ?? {}) as Record<string, unknown>;
  const locale = isLocale(b.locale) ? b.locale : 'ro';
  const image = typeof b.image === 'string' ? b.image : '';
  const userContext = typeof b.userContext === 'string' ? b.userContext.slice(0, 1200) : '';

  // --- validation --------------------------------------------------------
  const match = /^data:(image\/[a-z+]+);base64,/.exec(image);
  if (!match) return NextResponse.json({ error: 'invalid_image' }, { status: 400 });
  if (!ALLOWED.includes(match[1])) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  }
  const approxBytes = (image.length - match[0].length) * 0.75;
  if (approxBytes > MAX_IMAGE_MB * 1024 * 1024) {
    return NextResponse.json({ error: 'too_large', maxMb: MAX_IMAGE_MB }, { status: 413 });
  }

  if (!aiConfigured) {
    return NextResponse.json({ analysis: demoAnalysis(locale), demo: true });
  }

  try {
    const prompt = userContext
      ? `Analyse this photo. Relevant user context: ${userContext}`
      : 'Analyse this photo.';

    const result = await complete(
      SYSTEM(locale),
      [{ role: 'user', content: prompt, image }],
      { maxTokens: 1200 },
    );

    const parsed = result ? extractJson<Record<string, unknown>>(result.text) : null;
    if (!parsed) throw new Error('unparseable_model_output');

    const analysis: PhotoAnalysis = {
      ...normalize(parsed),
      id: `an_${Date.now().toString(36)}`,
      createdAt: Date.now(),
    };
    return NextResponse.json({ analysis, demo: false });
  } catch (error) {
    console.error('[api/analyze]', error);
    return NextResponse.json({ analysis: demoAnalysis(locale), demo: true, degraded: true });
  }
}
