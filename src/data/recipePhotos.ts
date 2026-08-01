/**
 * Rețetele care au o fotografie descărcată în `public/recipes/`.
 *
 * Fișierul acesta este rescris automat de `npm run fetch:photos`. Cât timp
 * lista este goală, aplicația nu cere nicio fotografie și afișează desenul
 * generat pentru fiecare preparat.
 *
 * De ce o listă și nu pur și simplu `<img src="/recipes/slug.webp">` cu
 * revenire la eroare: fără ea, browserul ar cere 178 de fișiere inexistente
 * la fiecare încărcare a paginii și ar umple consola cu 404-uri. Așa,
 * cererea pleacă doar pentru pozele care există cu adevărat.
 */
export const RECIPE_PHOTOS: ReadonlySet<string> = new Set([
  // completat de scripts/fetch-recipe-photos.mjs
]);

/** Adresa fotografiei locale, dacă rețeaua de fișiere o are. */
export function recipePhoto(slug: string): string | undefined {
  return RECIPE_PHOTOS.has(slug) ? `/recipes/${slug}.webp` : undefined;
}
