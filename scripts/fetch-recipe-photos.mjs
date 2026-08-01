#!/usr/bin/env node
/**
 * Descarcă o fotografie reală pentru fiecare rețetă și o pune în
 * `public/recipes/<slug>.webp`. Componenta FoodArt le găsește singură după
 * acest nume, deci după ce rulezi scriptul nu mai trebuie schimbat niciun cod.
 *
 *   npm run fetch:photos              # doar rețetele care n-au încă poză
 *   npm run fetch:photos -- --force   # descarcă din nou tot
 *   npm run fetch:photos -- --limit 20
 *
 * Sursa este Openverse (openverse.org) — un catalog de imagini cu licențe
 * deschise, fără cheie API. Fiecare fotografie descărcată este trecută în
 * `public/recipes/CREDITE.md`, cu autorul și licența ei: majoritatea
 * licențelor Creative Commons cer atribuire, iar fișierul acela este
 * dovada că a fost făcută.
 *
 * Dacă o rețetă nu primește nicio potrivire, nu se întâmplă nimic rău —
 * aplicația revine la desenul generat pentru acel preparat.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'recipes');
const CREDITS = path.join(OUT_DIR, 'CREDITE.md');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const LIMIT = Number(args[args.indexOf('--limit') + 1]) || Infinity;

/* ---------- 1. Citim rețetele din sursele TypeScript ---------- */
/* Nu compilăm proiectul doar ca să aflăm o listă: extragem `slug` și
   titlul englezesc direct din fișiere, cu o expresie regulată. */

async function readRecipes() {
  const dirs = [
    path.join(ROOT, 'src', 'data', 'recipeBatches'),
    path.join(ROOT, 'src', 'data'),
  ];

  const files = [];
  for (const dir of dirs) {
    let entries = [];
    try { entries = await fs.readdir(dir); } catch { continue; }
    for (const name of entries) {
      if (name.endsWith('.ts')) files.push(path.join(dir, name));
    }
  }

  const found = new Map();
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    // slug: 'papanasi'  …  title: L('ro', 'ru', 'en')
    const re = /slug:\s*'([^']+)'[\s\S]{0,600}?title:\s*L\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'(?:[^'\\]|\\.)*'\s*,\s*'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = re.exec(text))) {
      const [, slug, ro, en] = m;
      if (!found.has(slug)) {
        found.set(slug, { slug, ro: unescape(ro), en: unescape(en) });
      }
    }
  }
  return [...found.values()];
}

const unescape = (s) => s.replace(/\\'/g, "'").replace(/\\\\/g, '\\');

/* ---------- 2. Căutăm o imagine potrivită ---------- */

async function searchOpenverse(query) {
  const url =
    'https://api.openverse.org/v1/images/?' +
    new URLSearchParams({
      q: query,
      license_type: 'commercial,modification',
      category: 'photograph',
      size: 'medium',
      page_size: '5',
      mature: 'false',
    });

  const res = await fetch(url, {
    headers: { 'User-Agent': 'HonniAI-photo-fetcher/1.0' },
  });
  if (!res.ok) throw new Error(`Openverse a răspuns ${res.status}`);

  const data = await res.json();
  const hit = (data.results ?? []).find((r) => r.url);
  if (!hit) return null;

  return {
    url: hit.url,
    title: hit.title ?? query,
    creator: hit.creator ?? 'necunoscut',
    license: `${(hit.license ?? '').toUpperCase()} ${hit.license_version ?? ''}`.trim(),
    source: hit.foreign_landing_url ?? hit.url,
  };
}

/* ---------- 3. Convertim în WebP ---------- */

async function toWebp(buffer, dest) {
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    // Fără sharp salvăm originalul; aplicația îl afișează la fel de bine,
    // doar că fișierul e mai greu.
    await fs.writeFile(dest.replace(/\.webp$/, '.jpg'), buffer);
    return 'jpg';
  }
  await sharp(buffer)
    .resize({ width: 900, height: 640, fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toFile(dest);
  return 'webp';
}

/* ---------- 4. Manifestul citit de aplicație ---------- */

/**
 * Scrie lista rețetelor care chiar au fotografie. Fără ea, componenta
 * FoodArt ar cere un fișier pentru fiecare rețetă și ar umple consola cu
 * 404-uri pentru cele care lipsesc.
 */
async function writeManifest() {
  const files = await fs.readdir(OUT_DIR).catch(() => []);
  const slugs = files
    .filter((f) => f.endsWith('.webp') || f.endsWith('.jpg'))
    .map((f) => f.replace(/\.(webp|jpg)$/, ''))
    .sort();

  const body = `/**
 * Rețetele care au o fotografie descărcată în \`public/recipes/\`.
 *
 * Fișier generat de \`npm run fetch:photos\` — nu-l edita de mână.
 *
 * De ce o listă și nu pur și simplu \`<img src="/recipes/slug.webp">\` cu
 * revenire la eroare: fără ea, browserul ar cere zeci de fișiere inexistente
 * la fiecare încărcare a paginii și ar umple consola cu 404-uri.
 */
export const RECIPE_PHOTOS: ReadonlySet<string> = new Set([
${slugs.map((s) => `  '${s}',`).join('\n') || '  // nicio fotografie descărcată încă'}
]);

/** Adresa fotografiei locale, dacă există. */
export function recipePhoto(slug: string): string | undefined {
  return RECIPE_PHOTOS.has(slug) ? \`/recipes/\${slug}.webp\` : undefined;
}
`;

  await fs.writeFile(path.join(ROOT, 'src', 'data', 'recipePhotos.ts'), body);
  console.log(`\nManifest actualizat: ${slugs.length} rețete cu fotografie.`);
}

/* ---------- 5. Programul propriu-zis ---------- */

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const recipes = await readRecipes();
  if (!recipes.length) {
    console.error('Nu am găsit nicio rețetă în src/data. Rulează scriptul din rădăcina proiectului.');
    process.exit(1);
  }
  console.log(`Am găsit ${recipes.length} rețete.\n`);

  const credits = [];
  let downloaded = 0;
  let skipped = 0;
  let missed = 0;

  for (const recipe of recipes) {
    if (downloaded >= LIMIT) break;

    const dest = path.join(OUT_DIR, `${recipe.slug}.webp`);
    if (!FORCE) {
      try { await fs.access(dest); skipped += 1; continue; } catch { /* lipsește, mergem mai departe */ }
    }

    try {
      // Întâi titlul englezesc (catalogul e în engleză), apoi cel românesc.
      const hit =
        (await searchOpenverse(`${recipe.en} food dish`)) ??
        (await searchOpenverse(recipe.ro));

      if (!hit) {
        console.log(`  –  ${recipe.slug} — nicio potrivire`);
        missed += 1;
        continue;
      }

      const img = await fetch(hit.url, { headers: { 'User-Agent': 'HonniAI-photo-fetcher/1.0' } });
      if (!img.ok) throw new Error(`imaginea a răspuns ${img.status}`);

      const ext = await toWebp(Buffer.from(await img.arrayBuffer()), dest);
      credits.push(`| ${recipe.slug} | ${hit.title} | ${hit.creator} | ${hit.license} | ${hit.source} |`);
      downloaded += 1;
      console.log(`  ✓  ${recipe.slug}.${ext}  —  ${hit.license || 'licență nespecificată'}`);
    } catch (error) {
      missed += 1;
      console.log(`  !  ${recipe.slug} — ${error.message}`);
    }

    // Nu lovim serviciul prea des.
    await new Promise((r) => setTimeout(r, 350));
  }

  if (credits.length) {
    const header =
      '# Credite pentru fotografii\n\n' +
      'Fotografiile din acest dosar au fost descărcate cu `npm run fetch:photos`\n' +
      'din [Openverse](https://openverse.org). Licențele Creative Commons cer, în\n' +
      'majoritatea cazurilor, atribuirea autorului — tabelul de mai jos o asigură.\n\n' +
      '| Rețetă | Titlu | Autor | Licență | Sursă |\n| --- | --- | --- | --- | --- |\n';
    let existing = '';
    try { existing = await fs.readFile(CREDITS, 'utf8'); } catch { /* prima rulare */ }
    const body = existing.includes('| Rețetă |')
      ? existing.trimEnd() + '\n' + credits.join('\n') + '\n'
      : header + credits.join('\n') + '\n';
    await fs.writeFile(CREDITS, body);
  }

  await writeManifest();

  console.log(
    `\nGata — ${downloaded} descărcate, ${skipped} sărite (existau deja), ${missed} fără potrivire.`,
  );
  if (downloaded) console.log(`Creditele sunt în ${path.relative(ROOT, CREDITS)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
