'use client';

import { clsx } from 'clsx';
import { brand } from '@/config/brand';
import { FLAME_STROKES } from './flamePaths';

/**
 * Honni AI flame mark.
 *
 * - transparent background, no plate: it drops onto any surface
 * - painted with `currentColor`, so it follows the theme (ink on light,
 *   white on dark) unless a `tone` is forced
 * - `animated` staggers the strokes in, used by the splash screen
 */
export type LogoProps = {
  className?: string;
  /** Pixel size of the square mark. */
  size?: number;
  tone?: 'current' | 'brand' | 'white';
  title?: string;
  /** Decorative marks are hidden from assistive tech. */
  decorative?: boolean;
  animated?: boolean;
};

const TONE_CLASS: Record<NonNullable<LogoProps['tone']>, string> = {
  current: '',
  brand: 'text-brand-500',
  white: 'text-white',
};

export function LogoMark({
  className,
  size = 32,
  tone = 'current',
  title,
  decorative = false,
  animated = false,
}: LogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title || `${brand.name}`}
      className={clsx('shrink-0', TONE_CLASS[tone], className)}
      fill="currentColor"
    >
      {!decorative && <title>{title || brand.name}</title>}
      {FLAME_STROKES.map((d, i) => (
        <path
          key={i}
          d={d}
          style={
            animated
              ? {
                  animation: `logo-stroke-in 900ms cubic-bezier(0.22,1,0.36,1) ${i * 130}ms both`,
                  transformOrigin: '50% 100%',
                }
              : undefined
          }
        />
      ))}
    </svg>
  );
}

/** Mark + wordmark lockup used in the header, footer, auth and splash screens. */
export function Logo({
  className,
  size = 30,
  showText = true,
  textClassName,
  tone,
}: LogoProps & { showText?: boolean; textClassName?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} tone={tone} decorative />
      {showText && (
        <span
          className={clsx(
            'font-display text-[1.05rem] font-semibold tracking-tight',
            textClassName,
          )}
        >
          {brand.shortName}
          <span className="ml-1 bg-gradient-to-r from-brand-500 to-brand-300 bg-clip-text text-transparent">
            AI
          </span>
        </span>
      )}
    </span>
  );
}

export default Logo;
