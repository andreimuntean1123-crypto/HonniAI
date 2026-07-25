import { NextResponse } from 'next/server';
import { complete, aiConfigured, extractJson } from '@/lib/server/aiProvider';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';
import type {
  AllergenId,
  Locale,
  Localized,
  Recipe,
  ShoppingCategory,
} from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Model calls routinely need more than the 10s a serverless function gets by
// default; without this the platform kills the request mid-generation.
export const maxDuration = 60;

const isLocale = (v: unknown): v is Locale => v === 'ro' || v === 'ru' || v === 'en';
const LANGUAGE: Record<Locale, string> = { ro: 'Romanian', ru: 'Russian', en: 'English' };

const AISLES: ShoppingCategory[] = [
  'produce',
  'meat-fish',
  'dairy',
  'grains',
  'spices',
  'drinks',
  'frozen',
  'other',
];

const ALLERGENS: AllergenId[] = [
  'gluten',
  'lactose',
  'eggs',
  'nuts',
  'peanuts',
  'fish',
  'shellfish',
  'soy',
  'sesame',
  'alcohol',
  'celery',
  'mustard',
];

const SYSTEM = (locale: Locale) => `You write recipes for Honni AI as strict JSON.

Write every user-facing string in ${LANGUAGE[locale]}. Return ONLY the JSON object:
{
  "title": string,
  "description": string,
  "emoji": string,                 // one food emoji
  "cuisine": string,               // lowercase english id, e.g. "italian", "romanian", "japanese"
  "group": "food" | "drink",
  "categories": string[],          // from: appetizers, soups, mains, salads, desserts, breakfast, snacks, vegetarian, vegan, healthy, milkshakes, smoothies, mocktails, cocktails, coffee, tea, lemonades, traditional
  "prepMinutes": number,
  "cookMinutes": number,
  "difficulty": "easy" | "medium" | "hard",
  "servings": number,
  "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number, "sugar": number, "salt": number, "fiber": number },  // per serving
  "ingredients": [ { "name": string, "amount": number | null, "unit": string | null, "aisle": "produce"|"meat-fish"|"dairy"|"grains"|"spices"|"drinks"|"frozen"|"other" } ],
  "steps": string[],
  "tips": string[],
  "allergens": string[],           // from: gluten, lactose, eggs, nuts, peanuts, fish, shellfish, soy, sesame, alcohol, celery, mustard
  "substitutions": [ { "for": string, "use": string } ],
  "healthierVariant": string,
  "tags": string[],                // from: vegetarian, vegan, gluten-free, lactose-free, high-protein, low-calorie, quick, halal
  "budget": "low" | "medium" | "high",
  "mealSlots": string[]            // from: breakfast, lunch, dinner, snack
}

Rules:
- The recipe must be the most balanced, correct and tasty version of the dish requested.
- Real quantities, real timings. Nutrition values are per serving and are estimates.
- Respect the user's restrictions absolutely if any are given.
- Do not invent a traditional origin you are not sure about.`;

const loc = (value: string, locale: Locale): Localized => {
  // The model answers in one language; mirror it so the data model stays uniform.
  const base: Localized = { ro: value, ru: value, en: value };
  return { ...base, [locale]: value };
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'reteta';

const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;

const strings = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max) : [];

/** Converts the model output into a fully-typed Recipe. */
function toRecipe(raw: Record<string, unknown>, locale: Locale): Recipe {
  const title = typeof raw.title === 'string' ? raw.title.slice(0, 120) : 'Recipe';
  const id = `ai_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const n = (raw.nutrition ?? {}) as Record<string, unknown>;

  const ingredients = (Array.isArray(raw.ingredients) ? raw.ingredients : [])
    .slice(0, 30)
    .map((item, i) => {
      const ing = (item ?? {}) as Record<string, unknown>;
      const name = typeof ing.name === 'string' ? ing.name.slice(0, 80) : '—';
      const unit = typeof ing.unit === 'string' && ing.unit ? ing.unit.slice(0, 20) : null;
      return {
        id: `${id}_i${i}`,
        name: loc(name, locale),
        amount:
          typeof ing.amount === 'number' && Number.isFinite(ing.amount)
            ? Math.max(0, ing.amount)
            : null,
        unit: unit ? loc(unit, locale) : null,
        aisle: AISLES.includes(ing.aisle as ShoppingCategory)
          ? (ing.aisle as ShoppingCategory)
          : 'other',
      };
    });

  const steps = strings(raw.steps, 20);
  const tips = strings(raw.tips, 6);

  return {
    id,
    slug: slugify(title),
    group: raw.group === 'drink' ? 'drink' : 'food',
    categories: strings(raw.categories, 6) as Recipe['categories'],
    cuisine: typeof raw.cuisine === 'string' ? raw.cuisine.toLowerCase().slice(0, 30) : 'other',
    emoji: typeof raw.emoji === 'string' ? raw.emoji.slice(0, 4) : '🍽️',
    title: loc(title, locale),
    description: loc(
      typeof raw.description === 'string' ? raw.description.slice(0, 400) : '',
      locale,
    ),
    prepMinutes: Math.round(num(raw.prepMinutes, 0, 600, 15)),
    cookMinutes: Math.round(num(raw.cookMinutes, 0, 900, 20)),
    difficulty:
      raw.difficulty === 'easy' || raw.difficulty === 'hard'
        ? raw.difficulty
        : 'medium',
    servings: Math.round(num(raw.servings, 1, 20, 2)),
    nutrition: {
      calories: Math.round(num(n.calories, 0, 5000, 0)),
      protein: Math.round(num(n.protein, 0, 300, 0)),
      carbs: Math.round(num(n.carbs, 0, 500, 0)),
      fat: Math.round(num(n.fat, 0, 300, 0)),
      sugar: Math.round(num(n.sugar, 0, 300, 0)),
      salt: Math.round(num(n.salt, 0, 50, 0) * 10) / 10,
      fiber: Math.round(num(n.fiber, 0, 100, 0)),
    },
    ingredients,
    steps: { ro: steps, ru: steps, en: steps, [locale]: steps } as Recipe['steps'],
    tips: { ro: tips, ru: tips, en: tips, [locale]: tips } as Recipe['tips'],
    allergens: strings(raw.allergens, 12).filter((a): a is AllergenId =>
      ALLERGENS.includes(a as AllergenId),
    ),
    substitutions: (Array.isArray(raw.substitutions) ? raw.substitutions : [])
      .slice(0, 6)
      .map((item) => {
        const s = (item ?? {}) as Record<string, unknown>;
        return {
          for: loc(typeof s.for === 'string' ? s.for.slice(0, 80) : '', locale),
          use: loc(typeof s.use === 'string' ? s.use.slice(0, 160) : '', locale),
        };
      }),
    healthierVariant: loc(
      typeof raw.healthierVariant === 'string' ? raw.healthierVariant.slice(0, 400) : '',
      locale,
    ),
    tags: strings(raw.tags, 8) as Recipe['tags'],
    budget: raw.budget === 'low' || raw.budget === 'high' ? raw.budget : 'medium',
    mealSlots: strings(raw.mealSlots, 4) as Recipe['mealSlots'],
  };
}

export async function POST(req: Request) {
  const limit = rateLimit(`recipe:${clientIp(req)}`);
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
  const query = typeof b.query === 'string' ? b.query.trim().slice(0, 200) : '';
  const locale = isLocale(b.locale) ? b.locale : 'ro';
  const userContext = typeof b.userContext === 'string' ? b.userContext.slice(0, 1200) : '';
  const servings = num(b.servings, 1, 20, 0);

  if (!query) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  if (!aiConfigured) return NextResponse.json({ recipe: null, demo: true });

  try {
    const ask = [
      `Dish requested: "${query}".`,
      servings ? `Servings: ${servings}.` : '',
      userContext ? `User profile: ${userContext}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await complete(SYSTEM(locale), [{ role: 'user', content: ask }], {
      maxTokens: 2200,
    });
    const parsed = result ? extractJson<Record<string, unknown>>(result.text) : null;
    if (!parsed) throw new Error('unparseable_model_output');

    return NextResponse.json({ recipe: toRecipe(parsed, locale), demo: false });
  } catch (error) {
    console.error('[api/recipe]', error);
    return NextResponse.json({ recipe: null, demo: true, degraded: true });
  }
}
