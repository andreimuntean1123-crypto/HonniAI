'use client';

import { clsx } from 'clsx';
import { LogoMark } from '@/components/brand/Logo';

/** Shared page title block — keeps every route visually consistent. */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        'relative flex flex-col gap-4 pb-6 pt-8 sm:flex-row sm:items-end sm:justify-between sm:pt-12',
        className,
      )}
    >
      {/* watermark logo keeps the brand present on every page */}
      <LogoMark
        size={150}
        decorative
        className="pointer-events-none absolute -top-4 right-0 text-ink opacity-[0.035] dark:text-white dark:opacity-[0.06]"
      />
      <div className="relative max-w-2xl">
        <h1 className="flex items-center gap-3 font-display text-[1.75rem] font-semibold tracking-tight text-ink sm:text-4xl">
          {icon}
          {title}
        </h1>
        {subtitle && <p className="muted mt-2.5 text-[0.95rem]">{subtitle}</p>}
      </div>
      {action && <div className="relative shrink-0">{action}</div>}
    </div>
  );
}

export default PageHeader;
