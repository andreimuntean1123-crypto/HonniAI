import type { Locale, UserProfile } from '@/lib/types';
import { CUISINES } from '@/data/cuisines';
import { translate } from '@/i18n';

/**
 * Turns the stored preferences into one natural-language paragraph.
 * This is the string handed to every agent as user context, and it is also
 * shown to the user in Profile so nothing about them is sent invisibly.
 */
export function buildAiContext(profile: UserProfile, locale: Locale): string {
  const t = (k: string) => translate(locale, k);
  const parts: string[] = [];

  const list = (items: string[]) => items.filter(Boolean).join(', ');

  const templates = {
    ro: {
      none: 'Utilizatorul nu a salvat încă preferințe alimentare.',
      allergies: (v: string) => `este alergic la ${v}`,
      intolerances: (v: string) => `are intoleranță la ${v}`,
      disliked: (v: string) => `nu îi plac ${v}`,
      favorites: (v: string) => `îi plac ${v}`,
      cuisines: (v: string) => `preferă bucătăria ${v}`,
      diets: (v: string) => `urmează o alimentație ${v}`,
      goal: (v: string) => `obiectivul său este ${v}`,
      time: (v: number) => `preferă rețete care se pregătesc în maximum ${v} de minute`,
      prefix: 'Utilizatorul',
    },
    ru: {
      none: 'Пользователь ещё не сохранил пищевые предпочтения.',
      allergies: (v: string) => `имеет аллергию на ${v}`,
      intolerances: (v: string) => `имеет непереносимость: ${v}`,
      disliked: (v: string) => `не любит ${v}`,
      favorites: (v: string) => `любит ${v}`,
      cuisines: (v: string) => `предпочитает кухню: ${v}`,
      diets: (v: string) => `придерживается питания: ${v}`,
      goal: (v: string) => `его цель — ${v}`,
      time: (v: number) => `предпочитает рецепты не дольше ${v} минут`,
      prefix: 'Пользователь',
    },
    en: {
      none: 'The user has not saved any food preferences yet.',
      allergies: (v: string) => `is allergic to ${v}`,
      intolerances: (v: string) => `is intolerant to ${v}`,
      disliked: (v: string) => `dislikes ${v}`,
      favorites: (v: string) => `likes ${v}`,
      cuisines: (v: string) => `prefers ${v} cuisine`,
      diets: (v: string) => `follows a ${v} diet`,
      goal: (v: string) => `their goal is ${v}`,
      time: (v: number) => `prefers recipes ready in at most ${v} minutes`,
      prefix: 'The user',
    },
  } as const;

  const tpl = templates[locale];

  if (profile.allergies.length) parts.push(tpl.allergies(list(profile.allergies)));
  if (profile.intolerances.length) parts.push(tpl.intolerances(list(profile.intolerances)));
  if (profile.disliked.length) parts.push(tpl.disliked(list(profile.disliked)));
  if (profile.favoriteFoods.length) parts.push(tpl.favorites(list(profile.favoriteFoods)));
  if (profile.favoriteCuisines.length) {
    const names = profile.favoriteCuisines.map(
      (id) => CUISINES.find((c) => c.id === id)?.name[locale] ?? id,
    );
    parts.push(tpl.cuisines(list(names)));
  }
  if (profile.diets.length) {
    parts.push(tpl.diets(list(profile.diets.map((d) => t(`diets.${d}`)))));
  }
  if (profile.goal) {
    const goalKey = `planner.goal${profile.goal.charAt(0).toUpperCase()}${profile.goal.slice(1)}`;
    parts.push(tpl.goal(t(goalKey).toLowerCase()));
  }
  if (profile.maxCookingMinutes) parts.push(tpl.time(profile.maxCookingMinutes));

  if (!parts.length) return tpl.none;
  return `${tpl.prefix} ${parts.join(', ')}.`;
}

export const EMPTY_PROFILE: UserProfile = {
  locale: 'ro',
  theme: 'system',
  allergies: [],
  intolerances: [],
  disliked: [],
  favoriteFoods: [],
  favoriteCuisines: [],
  goal: null,
  maxCookingMinutes: null,
  diets: [],
  onboarded: false,
  aiContext: '',
};
