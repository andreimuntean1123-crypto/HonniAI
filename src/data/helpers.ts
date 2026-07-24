import type { Ingredient, Localized, ShoppingCategory } from '@/lib/types';

/** Compact constructors keep the recipe data readable. */
export const L = (ro: string, ru: string, en: string): Localized => ({ ro, ru, en });

export const U = {
  g: L('g', 'г', 'g'),
  kg: L('kg', 'кг', 'kg'),
  ml: L('ml', 'мл', 'ml'),
  l: L('l', 'л', 'l'),
  pcs: L('buc', 'шт', 'pcs'),
  tbsp: L('linguri', 'ст. л.', 'tbsp'),
  tsp: L('lingurițe', 'ч. л.', 'tsp'),
  clove: L('căței', 'зубчика', 'cloves'),
  slice: L('felii', 'ломтика', 'slices'),
  pinch: L('vârf de cuțit', 'щепотка', 'pinch'),
  bunch: L('legătură', 'пучок', 'bunch'),
  cup: L('cană', 'стакан', 'cup'),
} as const;

export const ing = (
  id: string,
  name: Localized,
  amount: number | null,
  unit: Localized | null,
  aisle: ShoppingCategory,
  optional = false,
): Ingredient => ({ id, name, amount, unit, aisle, optional });
