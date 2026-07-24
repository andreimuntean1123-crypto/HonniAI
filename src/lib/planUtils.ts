import type { Locale, MealPlan, PlanDay, PlanMeal, Recipe } from '@/lib/types';
import { macroTargets, sumNutrition } from '@/lib/nutrition';
import { uid } from '@/lib/storage';

/** Default planner input used when a plan is created implicitly from a recipe. */
const DEFAULT_INPUT: MealPlan['input'] = {
  age: 30,
  heightCm: 172,
  weightKg: 70,
  sex: 'unspecified',
  activity: 'moderate',
  goal: 'maintain',
  mealsPerDay: 4,
  allergies: [],
  intolerances: [],
  excluded: [],
  disliked: [],
  favoriteCuisines: [],
  favoriteFoods: [],
  budget: 'medium',
  cookingMinutes: 40,
  equipment: [],
  days: 1,
  diets: [],
};

/**
 * Adds a recipe as a meal to the most recent plan (creating one if none exists).
 * Returns the updated plan so the caller can persist it.
 */
export function addRecipeToPlan(
  plans: MealPlan[],
  recipe: Recipe,
  locale: Locale,
  t: (key: string) => string,
  scale = 1,
): MealPlan {
  const meal: PlanMeal = {
    id: uid('meal'),
    slot: recipe.mealSlots.includes('breakfast')
      ? 'breakfast'
      : recipe.mealSlots.includes('lunch')
        ? 'lunch'
        : recipe.mealSlots.includes('dinner')
          ? 'dinner'
          : 'snack',
    title: recipe.title[locale],
    description: recipe.description[locale],
    quantity: `${Math.round(recipe.servings * scale)} × ${t('common.portion')}`,
    nutrition: recipe.nutrition,
    alternatives: recipe.substitutions.map((s) => s.use[locale]).slice(0, 3),
    recipeId: recipe.id,
  };

  const existing = plans[0];
  if (existing) {
    const days = existing.days.map((day, i) =>
      i === 0
        ? {
            ...day,
            meals: [...day.meals, meal],
            totals: sumNutrition([...day.meals, meal].map((m) => m.nutrition)),
          }
        : day,
    );
    return { ...existing, days, createdAt: Date.now() };
  }

  const day: PlanDay = {
    id: uid('day'),
    dayIndex: 0,
    label: t('planner.monday'),
    meals: [meal],
    totals: meal.nutrition,
    waterMl: 2000,
  };

  return {
    id: uid('plan'),
    createdAt: Date.now(),
    title: t('planner.planTitle'),
    goal: 'maintain',
    targetCalories: 2000,
    macroTargets: macroTargets(2000, 'maintain'),
    days: [day],
    notes: [],
    input: DEFAULT_INPUT,
  };
}

/** Plain-text export used by "print / export" on the planner page. */
export function planToText(plan: MealPlan, t: (key: string) => string): string {
  const lines: string[] = [];
  lines.push(plan.title || t('planner.planTitle'));
  lines.push('');
  lines.push(`${t('planner.needs')}: ${plan.targetCalories} ${t('common.kcal')}`);
  lines.push(
    `${t('recipes.protein')} ${plan.macroTargets.protein} g · ${t('recipes.carbs')} ${plan.macroTargets.carbs} g · ${t('recipes.fat')} ${plan.macroTargets.fat} g`,
  );
  lines.push('');

  for (const day of plan.days) {
    lines.push(`— ${day.label} —`);
    for (const meal of day.meals) {
      const slotKey = meal.slot === 'snack2' ? 'snack' : meal.slot;
      lines.push(
        `${t(`planner.${slotKey}`)}: ${meal.title}${meal.quantity ? ` (${meal.quantity})` : ''} — ${meal.nutrition.calories} ${t('common.kcal')}`,
      );
    }
    lines.push(
      `${t('common.total')}: ${day.totals.calories} ${t('common.kcal')} · ${t('planner.water')}: ${day.waterMl} ml`,
    );
    lines.push('');
  }

  if (plan.notes.length) {
    lines.push(`${t('planner.advice')}:`);
    plan.notes.forEach((n) => lines.push(`- ${n}`));
    lines.push('');
  }
  lines.push(t('planner.disclaimer'));
  return lines.join('\n');
}
