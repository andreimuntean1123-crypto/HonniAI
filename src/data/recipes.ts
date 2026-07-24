import type {
  DrinkCategory,
  FoodCategory,
  Locale,
  Recipe,
  RecipeCategory,
  RecipeFilters,
  RecipeGroup,
} from '@/lib/types';
import { FOOD_RECIPES } from './recipesFood';
import { DRINK_RECIPES } from './recipesDrinks';

export const RECIPES: Recipe[] = [...FOOD_RECIPES, ...DRINK_RECIPES];

export const FOOD_CATEGORIES: { id: FoodCategory; emoji: string }[] = [
  { id: 'appetizers', emoji: '🥟' },
  { id: 'soups', emoji: '🍲' },
  { id: 'mains', emoji: '🍽️' },
  { id: 'salads', emoji: '🥗' },
  { id: 'desserts', emoji: '🍰' },
  { id: 'breakfast', emoji: '🍳' },
  { id: 'snacks', emoji: '🥨' },
  { id: 'vegetarian', emoji: '🥦' },
  { id: 'vegan', emoji: '🌱' },
  { id: 'healthy', emoji: '💚' },
];

export const DRINK_CATEGORIES: { id: DrinkCategory; emoji: string }[] = [
  { id: 'milkshakes', emoji: '🥤' },
  { id: 'smoothies', emoji: '🥬' },
  { id: 'mocktails', emoji: '🍹' },
  { id: 'cocktails', emoji: '🍸' },
  { id: 'coffee', emoji: '☕' },
  { id: 'tea', emoji: '🫖' },
  { id: 'lemonades', emoji: '🍋' },
  { id: 'traditional', emoji: '🍯' },
];

export const getRecipe = (idOrSlug: string) =>
  RECIPES.find((r) => r.id === idOrSlug || r.slug === idOrSlug);

export const totalTime = (r: Recipe) => r.prepMinutes + r.cookMinutes;

/** Normalizes diacritics + case so "sarmale" matches "Sărmăluțe". */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function matchesQuery(recipe: Recipe, query: string, locale: Locale): boolean {
  if (!query.trim()) return true;
  const q = norm(query);
  const haystack = [
    recipe.title[locale],
    recipe.title.en,
    recipe.description[locale],
    recipe.cuisine,
    ...recipe.categories,
    ...recipe.tags,
    ...recipe.ingredients.map((i) => i.name[locale]),
  ]
    .map(norm)
    .join(' ');
  // every word of the query must appear somewhere
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function filterRecipes(
  recipes: Recipe[],
  filters: RecipeFilters,
  locale: Locale,
  group?: RecipeGroup,
  category?: RecipeCategory | null,
): Recipe[] {
  return recipes.filter((r) => {
    if (group && r.group !== group) return false;
    if (category && !r.categories.includes(category)) return false;
    if (!matchesQuery(r, filters.query, locale)) return false;
    if (filters.maxTotalMinutes && totalTime(r) > filters.maxTotalMinutes) return false;
    if (filters.maxCalories && r.nutrition.calories > filters.maxCalories) return false;
    if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
    if (filters.budget && r.budget !== filters.budget) return false;
    if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
    if (filters.mealSlot && !r.mealSlots.includes(filters.mealSlot)) return false;
    if (filters.diets.length && !filters.diets.every((d) => r.tags.includes(d))) return false;
    if (filters.pantry.length) {
      const names = r.ingredients.map((i) => norm(i.name[locale])).join(' ');
      const hits = filters.pantry.filter((p) => p.trim() && names.includes(norm(p)));
      // at least one pantry item must actually be used by the recipe
      if (!hits.length) return false;
    }
    return true;
  });
}

/** Ranks by how well the recipe uses the pantry, then by rating. */
export function sortByRelevance(recipes: Recipe[], pantry: string[], locale: Locale): Recipe[] {
  if (!pantry.length) return [...recipes].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const score = (r: Recipe) => {
    const names = r.ingredients.map((i) => norm(i.name[locale])).join(' ');
    return pantry.filter((p) => p.trim() && names.includes(norm(p))).length;
  };
  return [...recipes].sort((a, b) => score(b) - score(a) || (b.rating ?? 0) - (a.rating ?? 0));
}

export const EMPTY_FILTERS: RecipeFilters = {
  query: '',
  diets: [],
  pantry: [],
};
