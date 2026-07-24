import type { Nutrition, PlanGoal, PlannerInput } from '@/lib/types';

/** Mifflin–St Jeor basal metabolic rate. */
export function bmr({ age, heightCm, weightKg, sex }: PlannerInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78; // midpoint when unspecified
}

const ACTIVITY_FACTOR = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
} as const;

const GOAL_DELTA: Record<PlanGoal, number> = {
  maintain: 0,
  gain: 350,
  lose: -400,
  muscle: 250,
  healthier: 0,
};

/** Total daily energy expenditure, adjusted for the goal. */
export function targetCalories(input: PlannerInput): number {
  const tdee = bmr(input) * ACTIVITY_FACTOR[input.activity];
  const adjusted = tdee + GOAL_DELTA[input.goal];
  // Safety floor: never plan an aggressive deficit.
  const floor = input.sex === 'male' ? 1500 : 1300;
  return Math.round(Math.max(floor, adjusted) / 10) * 10;
}

/** Grams of protein / carbs / fat for the goal, from the calorie target. */
export function macroTargets(
  calories: number,
  goal: PlanGoal,
): { protein: number; carbs: number; fat: number } {
  const split =
    goal === 'muscle'
      ? { p: 0.3, c: 0.42, f: 0.28 }
      : goal === 'lose'
        ? { p: 0.32, c: 0.36, f: 0.32 }
        : goal === 'gain'
          ? { p: 0.22, c: 0.5, f: 0.28 }
          : { p: 0.25, c: 0.45, f: 0.3 };
  return {
    protein: Math.round((calories * split.p) / 4),
    carbs: Math.round((calories * split.c) / 4),
    fat: Math.round((calories * split.f) / 9),
  };
}

/** Roughly 30 ml per kg, nudged up with activity. */
export function waterMl(input: PlannerInput): number {
  const activityBonus =
    input.activity === 'athlete' ? 700 : input.activity === 'active' ? 500 : 250;
  return Math.round((input.weightKg * 30 + activityBonus) / 50) * 50;
}

export function sumNutrition(items: Nutrition[]): Nutrition {
  return items.reduce<Nutrition>(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      protein: acc.protein + n.protein,
      carbs: acc.carbs + n.carbs,
      fat: acc.fat + n.fat,
      sugar: (acc.sugar ?? 0) + (n.sugar ?? 0),
      salt: Math.round(((acc.salt ?? 0) + (n.salt ?? 0)) * 10) / 10,
      fiber: (acc.fiber ?? 0) + (n.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0, fiber: 0 },
  );
}

export const scaleNutrition = (n: Nutrition, factor: number): Nutrition => ({
  calories: Math.round(n.calories * factor),
  protein: Math.round(n.protein * factor),
  carbs: Math.round(n.carbs * factor),
  fat: Math.round(n.fat * factor),
  sugar: n.sugar === undefined ? undefined : Math.round(n.sugar * factor),
  salt: n.salt === undefined ? undefined : Math.round(n.salt * factor * 10) / 10,
  fiber: n.fiber === undefined ? undefined : Math.round(n.fiber * factor),
});

/**
 * A transparent 0–100 score used by the photo analysis when the model does not
 * return one. Rewards protein and fibre, penalises sugar, saturated-ish fat
 * density and salt. Deliberately coarse — it is presented as indicative only.
 */
export function healthScore(n: Nutrition, portionGrams = 300): number {
  const per100 = (v: number) => (v / Math.max(portionGrams, 1)) * 100;
  let score = 70;
  score += Math.min(15, per100(n.protein) * 1.5);
  score += Math.min(10, per100(n.fiber ?? 0) * 3);
  score -= Math.min(25, per100(n.sugar ?? 0) * 1.6);
  score -= Math.min(20, Math.max(0, per100(n.fat) - 8) * 1.2);
  score -= Math.min(15, Math.max(0, (n.salt ?? 0) - 1.5) * 6);
  score -= Math.min(15, Math.max(0, per100(n.calories) - 180) / 12);
  return Math.max(5, Math.min(98, Math.round(score)));
}
