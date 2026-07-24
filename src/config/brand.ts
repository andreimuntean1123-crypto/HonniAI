/**
 * Single source of truth for the product identity.
 *
 * Renaming the product or swapping the logo is a one-file change:
 *  - text/name/tagline/contact  -> here
 *  - logo mark                  -> src/components/brand/Logo.tsx
 *  - colours                    -> CSS variables in src/app/globals.css
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Honni AI',
  shortName: 'Honni',
  /** Used by the loading screen and the <title> template. */
  tagline: {
    ro: 'Gastronomie și alimentație personalizată',
    ru: 'Гастрономия и персональное питание',
    en: 'Gastronomy & personalized nutrition',
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  /** Neon accent used across the UI (matches the logo green). */
  accentHex: '#22e04a',
  /** Storage namespace — bump to invalidate everything stored locally. */
  storagePrefix: 'honni.v1',
} as const;

export type Brand = typeof brand;
