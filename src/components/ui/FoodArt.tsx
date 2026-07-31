'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

/**
 * Imaginea unei rețete sau a unei bucătării.
 *
 * Ordinea în care încearcă să afișeze ceva:
 *
 *   1. `image` — o adresă explicită, dacă rețeta are una;
 *   2. `/recipes/<slug>.webp` — fotografia locală, dacă a fost descărcată
 *      cu `npm run fetch:photos` (vezi `scripts/fetch-recipe-photos.mjs`);
 *   3. desenul generat — un degrade calculat din numele preparatului, cu
 *      emoji-ul în mijloc.
 *
 * Pasul 2 înseamnă că, după ce rulezi scriptul o singură dată, toate
 * rețetele capătă fotografii reale fără nicio modificare de cod: fișierele
 * apar în `public/recipes/`, iar componenta le găsește singură. Dacă o
 * fotografie lipsește, `onError` coboară automat la desenul generat, deci
 * nu apare niciodată o imagine ruptă.
 */

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export type FoodArtProps = {
  seed: string;
  emoji?: string;
  image?: string;
  className?: string;
  /** Larger emoji + softer blur for hero contexts. */
  size?: 'sm' | 'md' | 'lg';
  gradient?: [string, string];
  rounded?: string;
};

export function FoodArt({
  seed,
  emoji = '🍽️',
  image,
  className,
  size = 'md',
  gradient,
  rounded = 'rounded-3xl',
}: FoodArtProps) {
  // Fotografia locală se încearcă doar dacă nu a fost dată una explicită.
  // `failed` urcă un nivel de fiecare dată când o sursă nu se încarcă.
  const [failed, setFailed] = useState(false);

  const src = image ?? (seed ? `/recipes/${seed}.webp` : undefined);
  const showPhoto = Boolean(src) && !failed;

  const h = hash(seed);
  // Appetizing food palette only: warm ambers/reds through olive to fresh green.
  // Random hues across the full wheel produce magenta/blue cards that read as
  // "not food", so the range is deliberately clamped.
  const APPETIZING_HUES = [18, 28, 36, 44, 78, 96, 124, 142, 158, 8];
  const hue = APPETIZING_HUES[h % APPETIZING_HUES.length];
  const hue2 = (hue + 22 + (h % 18)) % 360;

  const background = gradient
    ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`
    : `linear-gradient(135deg, hsl(${hue} 62% 58%), hsl(${hue2} 58% 38%))`;

  return (
    <div
      className={clsx('relative overflow-hidden', rounded, className)}
      style={showPhoto ? undefined : { background }}
      aria-hidden
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          {/* soft light blooms keep the flat gradient from looking cheap */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                'radial-gradient(60% 60% at 25% 20%, rgba(255,255,255,0.45), transparent 60%), radial-gradient(70% 70% at 85% 90%, rgba(0,0,0,0.28), transparent 60%)',
            }}
          />
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center drop-shadow-[0_6px_18px_rgba(0,0,0,0.28)]',
              size === 'sm' && 'text-4xl',
              size === 'md' && 'text-6xl',
              size === 'lg' && 'text-8xl',
            )}
          >
            <span className="select-none">{emoji}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default FoodArt;
