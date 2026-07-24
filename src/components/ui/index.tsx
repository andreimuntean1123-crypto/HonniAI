'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

/* -------------------------------------------------------------------------- */
/* Reveal — scroll-in animation used across every page                         */
/* -------------------------------------------------------------------------- */

export function Reveal({
  children,
  delay = 0,
  className,
  y = 18,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeletons                                                                   */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden p-0">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-ink-muted">{icon}</div>}
      <p className="font-display text-lg font-medium text-ink">{title}</p>
      {text && <p className="muted max-w-sm">{text}</p>}
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TagInput — used by the planner, profile and onboarding                      */
/* -------------------------------------------------------------------------- */

export function TagInput({
  value,
  onChange,
  placeholder,
  hint,
  suggestions = [],
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
  suggestions?: string[];
  id?: string;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const item = raw.trim().replace(/,$/, '');
    if (!item) return;
    if (value.some((v) => v.toLowerCase() === item.toLowerCase())) return;
    onChange([...value, item]);
    setDraft('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span key={tag} className="chip chip-active">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="text-ink-muted transition-colors hover:text-ink"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        id={id}
        className={clsx('input', value.length && 'mt-2')}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
      />
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
            .slice(0, 8)
            .map((s) => (
              <button key={s} type="button" className="chip" onClick={() => add(s)}>
                + {s}
              </button>
            ))}
        </div>
      )}
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Segmented control                                                           */
/* -------------------------------------------------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'inline-flex rounded-full border border-hairline bg-surface-2/70 p-1',
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((o) => o.value).join('')}`}
                className="absolute inset-0 rounded-full bg-surface shadow-soft"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat + nutrition bar                                                        */
/* -------------------------------------------------------------------------- */

export function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2/50 px-3 py-2.5 text-center">
      <p
        className={clsx(
          'font-display text-lg font-semibold tracking-tight',
          accent ? 'text-brand-500 neon' : 'text-ink',
        )}
      >
        {value}
        {suffix && <span className="ml-0.5 text-xs font-normal text-ink-muted">{suffix}</span>}
      </p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
    </div>
  );
}

export function MacroBar({
  protein,
  carbs,
  fat,
  labels,
}: {
  protein: number;
  carbs: number;
  fat: number;
  labels: [string, string, string];
}) {
  const kcal = protein * 4 + carbs * 4 + fat * 9 || 1;
  const parts = [
    { pct: ((protein * 4) / kcal) * 100, color: 'bg-brand-500', label: labels[0], grams: protein },
    { pct: ((carbs * 4) / kcal) * 100, color: 'bg-sky-400', label: labels[1], grams: carbs },
    { pct: ((fat * 9) / kcal) * 100, color: 'bg-amber-400', label: labels[2], grams: fat },
  ];

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink/[0.07] dark:bg-white/10">
        {parts.map((p) => (
          <div key={p.label} className={p.color} style={{ width: `${p.pct}%` }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5">
            <span className={clsx('h-2 w-2 rounded-full', p.color)} />
            {p.label} {Math.round(p.grams)} g
          </span>
        ))}
      </div>
    </div>
  );
}
