import { NextResponse } from 'next/server';
import { complete, aiConfigured, extractJson } from '@/lib/server/aiProvider';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';
import { macroTargets, sumNutrition, targetCalories, waterMl } from '@/lib/nutrition';
import type { Locale, MealPlan, PlanDay, PlanMeal, PlannerInput } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isLocale = (v: unknown): v is Locale => v === 'ro' || v === 'ru' || v === 'en';

const LANGUAGE: Record<Locale, string> = { ro: 'Romanian', ru: 'Russian', en: 'English' };

const SLOTS = ['breakfast', 'snack', 'lunch', 'snack2', 'dinner'] as const;

/** Minimal validation of the planner form (the UI validates too). */
function parseInput(v: unknown): PlannerInput | null {
  if (typeof v !== 'object' || v === null) return null;
  const b = v as Record<string, unknown>;
  const num = (x: unknown, min: number, max: number, fallback: number) =>
    typeof x === 'number' && Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback;
  const list = (x: unknown) =>
    Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string').slice(0, 30) : [];

  return {
    age: num(b.age, 10, 100, 30),
    heightCm: num(b.heightCm, 100, 230, 170),
    weightKg: num(b.weightKg, 30, 250, 70),
    sex: b.sex === 'male' || b.sex === 'female' ? b.sex : 'unspecified',
    activity:
      typeof b.activity === 'string' &&
      ['sedentary', 'light', 'moderate', 'active', 'athlete'].includes(b.activity)
        ? (b.activity as PlannerInput['activity'])
        : 'moderate',
    goal:
      typeof b.goal === 'string' &&
      ['maintain', 'gain', 'lose', 'muscle', 'healthier'].includes(b.goal)
        ? (b.goal as PlannerInput['goal'])
        : 'maintain',
    mealsPerDay: num(b.mealsPerDay, 2, 6, 4),
    allergies: list(b.allergies),
    intolerances: list(b.intolerances),
    excluded: list(b.excluded),
    disliked: list(b.disliked),
    favoriteCuisines: list(b.favoriteCuisines),
    favoriteFoods: list(b.favoriteFoods),
    budget: b.budget === 'low' || b.budget === 'high' ? b.budget : 'medium',
    cookingMinutes: num(b.cookingMinutes, 5, 240, 40),
    equipment: list(b.equipment),
    days: num(b.days, 1, 7, 1),
    diets: list(b.diets) as PlannerInput['diets'],
  };
}

const buildPrompt = (input: PlannerInput, locale: Locale, calories: number) => `Build a meal plan.

Write every user-facing string in ${LANGUAGE[locale]}.

Person: ${input.age} years, ${input.heightCm} cm, ${input.weightKg} kg, sex: ${input.sex},
activity: ${input.activity}, goal: ${input.goal}, meals per day: ${input.mealsPerDay},
days: ${input.days}, cooking time available: ${input.cookingMinutes} min, budget: ${input.budget}.
Allergies: ${input.allergies.join(', ') || '—'}
Intolerances: ${input.intolerances.join(', ') || '—'}
Never eats: ${input.excluded.join(', ') || '—'}
Dislikes: ${input.disliked.join(', ') || '—'}
Diet preferences: ${input.diets.join(', ') || '—'}
Favourite cuisines: ${input.favoriteCuisines.join(', ') || '—'}
Favourite foods: ${input.favoriteFoods.join(', ') || '—'}
Equipment: ${input.equipment.join(', ') || '—'}
Daily energy target: about ${calories} kcal.

Return ONLY JSON, no prose:
{
  "days": [
    {
      "label": string,                       // weekday name in ${LANGUAGE[locale]}
      "meals": [
        {
          "slot": "breakfast" | "snack" | "lunch" | "snack2" | "dinner",
          "title": string,
          "description": string,             // one short sentence
          "quantity": string,                // e.g. "150 g rice + 120 g chicken"
          "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number },
          "alternatives": string[]           // 2-3 swaps respecting the same restrictions
        }
      ]
    }
  ],
  "notes": string[]                          // 3 short practical tips
}

Hard rules:
- Exactly ${input.days} day(s) and ${input.mealsPerDay} meals per day.
- Never include anything from the allergy, intolerance, exclusion or dislike lists — not even as an alternative.
- Daily calories must land within 10% of the target.
- No extreme dieting advice, no medical claims.`;

export async function POST(req: Request) {
  const limit = rateLimit(`plan:${clientIp(req)}`);
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
  const input = parseInput(b.input);
  const locale = isLocale(b.locale) ? b.locale : 'ro';
  if (!input) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const calories = targetCalories(input);

  // No key configured → the client builds the plan locally from the recipe library.
  if (!aiConfigured) return NextResponse.json({ plan: null, demo: true });

  try {
    const result = await complete(
      `You are Nutrition Planner AI for Honni AI. You answer with valid JSON only.`,
      [{ role: 'user', content: buildPrompt(input, locale, calories) }],
      { maxTokens: 3000 },
    );

    const parsed = result
      ? extractJson<{ days?: unknown[]; notes?: unknown[] }>(result.text)
      : null;
    if (!parsed?.days?.length) throw new Error('unparseable_model_output');

    const days: PlanDay[] = parsed.days.slice(0, 7).map((rawDay, dayIndex) => {
      const d = (rawDay ?? {}) as Record<string, unknown>;
      const rawMeals = Array.isArray(d.meals) ? d.meals : [];
      const meals: PlanMeal[] = rawMeals.slice(0, 6).map((rawMeal, i) => {
        const m = (rawMeal ?? {}) as Record<string, unknown>;
        const n = (m.nutrition ?? {}) as Record<string, unknown>;
        const num = (x: unknown, fallback = 0) =>
          typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.round(x)) : fallback;
        return {
          id: `meal_${dayIndex}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          slot: (SLOTS as readonly string[]).includes(String(m.slot))
            ? (m.slot as PlanMeal['slot'])
            : SLOTS[Math.min(i, SLOTS.length - 1)],
          title: typeof m.title === 'string' ? m.title.slice(0, 120) : '—',
          description: typeof m.description === 'string' ? m.description.slice(0, 300) : '',
          quantity: typeof m.quantity === 'string' ? m.quantity.slice(0, 120) : '',
          nutrition: {
            calories: num(n.calories),
            protein: num(n.protein),
            carbs: num(n.carbs),
            fat: num(n.fat),
          },
          alternatives: Array.isArray(m.alternatives)
            ? m.alternatives.filter((x): x is string => typeof x === 'string').slice(0, 4)
            : [],
        };
      });

      return {
        id: `day_${dayIndex}_${Math.random().toString(36).slice(2, 7)}`,
        dayIndex,
        label: typeof d.label === 'string' ? d.label.slice(0, 40) : `#${dayIndex + 1}`,
        meals,
        totals: sumNutrition(meals.map((m) => m.nutrition)),
        waterMl: waterMl(input),
      };
    });

    const plan: MealPlan = {
      id: `plan_${Date.now().toString(36)}`,
      createdAt: Date.now(),
      title: '',
      goal: input.goal,
      targetCalories: calories,
      macroTargets: macroTargets(calories, input.goal),
      days,
      notes: Array.isArray(parsed.notes)
        ? parsed.notes.filter((x): x is string => typeof x === 'string').slice(0, 5)
        : [],
      input,
      demo: false,
    };

    return NextResponse.json({ plan, demo: false });
  } catch (error) {
    console.error('[api/plan]', error);
    return NextResponse.json({ plan: null, demo: true, degraded: true });
  }
}
