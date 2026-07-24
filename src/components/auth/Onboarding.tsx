'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlanGoal } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useData } from '@/components/providers/DataProvider';
import { Modal } from '@/components/ui/Modal';
import { TagInput } from '@/components/ui';
import { CUISINES } from '@/data/cuisines';
import { buildAiContext } from '@/lib/profileContext';

/**
 * First-run questionnaire. Runs once per account and produces the natural
 * language profile handed to every agent.
 */
export function Onboarding() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { data, updateProfile, ready } = useData();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const [allergies, setAllergies] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [goal, setGoal] = useState<PlanGoal | null>(null);
  const [minutes, setMinutes] = useState(40);

  useEffect(() => {
    if (!ready || !user) return;
    if (!data.profile.onboarded) {
      setAllergies(data.profile.allergies);
      setDisliked(data.profile.disliked);
      setCuisines(data.profile.favoriteCuisines);
      setGoal(data.profile.goal);
      setOpen(true);
    }
  }, [ready, user, data.profile]);

  const preview = useMemo(
    () =>
      buildAiContext(
        {
          ...data.profile,
          allergies,
          disliked,
          favoriteCuisines: cuisines,
          goal,
          maxCookingMinutes: minutes,
        },
        locale,
      ),
    [allergies, cuisines, data.profile, disliked, goal, locale, minutes],
  );

  const finish = () => {
    updateProfile({
      allergies,
      disliked,
      favoriteCuisines: cuisines,
      goal,
      maxCookingMinutes: minutes,
      onboarded: true,
    });
    setOpen(false);
  };

  const GOALS: PlanGoal[] = ['maintain', 'lose', 'gain', 'muscle', 'healthier'];

  const steps = [
    {
      title: t('onboarding.step1'),
      body: (
        <TagInput
          value={allergies}
          onChange={setAllergies}
          placeholder={t('planner.allergies')}
          hint={t('onboarding.allergyHint')}
          suggestions={
            locale === 'ro'
              ? ['arahide', 'lactoză', 'gluten', 'fructe de mare', 'ouă']
              : locale === 'ru'
                ? ['арахис', 'лактоза', 'глютен', 'морепродукты', 'яйца']
                : ['peanuts', 'lactose', 'gluten', 'shellfish', 'eggs']
          }
        />
      ),
    },
    {
      title: t('onboarding.step2'),
      body: (
        <TagInput
          value={disliked}
          onChange={setDisliked}
          placeholder={t('planner.disliked')}
          hint={t('onboarding.dislikeHint')}
          suggestions={
            locale === 'ro'
              ? ['ciuperci', 'vinete', 'ficat', 'măsline']
              : locale === 'ru'
                ? ['грибы', 'баклажаны', 'печень', 'оливки']
                : ['mushrooms', 'eggplant', 'liver', 'olives']
          }
        />
      ),
    },
    {
      title: t('onboarding.step3'),
      body: (
        <div className="flex flex-wrap gap-1.5">
          {CUISINES.map((c) => {
            const active = cuisines.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() =>
                  setCuisines((prev) =>
                    active ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                  )
                }
                className={clsx('chip', active && 'chip-active')}
              >
                <span>{c.flag}</span>
                {c.name[locale]}
                {active && <Check size={12} />}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: t('onboarding.step4'),
      body: (
        <div className="grid gap-1.5 sm:grid-cols-2">
          {GOALS.map((g) => {
            const key = `planner.goal${g.charAt(0).toUpperCase()}${g.slice(1)}`;
            const active = goal === g;
            return (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={clsx(
                  'rounded-2xl border px-4 py-3 text-left text-sm transition-all',
                  active
                    ? 'border-brand-500/60 bg-brand-500/10 text-ink ring-neon'
                    : 'border-hairline bg-surface-2/50 text-ink-soft hover:border-brand-500/40',
                )}
              >
                {t(key)}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: t('onboarding.step5'),
      body: (
        <div>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full accent-[rgb(var(--brand-500))]"
          />
          <p className="mt-2 text-center font-display text-2xl font-semibold text-ink">
            {minutes} <span className="text-sm font-normal text-ink-muted">{t('common.minutes')}</span>
          </p>
        </div>
      ),
    },
    {
      title: t('onboarding.doneTitle'),
      body: (
        <div className="space-y-3">
          <p className="muted">{t('onboarding.doneText')}</p>
          <div className="rounded-2xl border border-brand-500/25 bg-brand-500/[0.07] p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-300">
              <Sparkles size={12} />
              {t('onboarding.contextTitle')}
            </p>
            <p className="text-sm leading-relaxed text-ink">{preview}</p>
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <Modal
      open={open}
      onClose={finish}
      title={t('onboarding.title')}
      variant="sheet"
      className="sm:max-w-lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => (step === 0 ? finish() : setStep((s) => s - 1))}
            className="btn-ghost btn-sm"
          >
            {step === 0 ? (
              t('common.skip')
            ) : (
              <>
                <ChevronLeft size={14} />
                {t('common.back')}
              </>
            )}
          </button>

          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={clsx(
                  'h-1.5 rounded-full transition-all',
                  i === step ? 'w-5 bg-brand-500' : 'w-1.5 bg-ink/15 dark:bg-white/20',
                )}
              />
            ))}
          </div>

          <button
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
            className="btn-primary btn-sm"
          >
            {isLast ? t('common.finish') : t('common.next')}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      }
    >
      <p className="muted mb-5 text-xs">{t('onboarding.subtitle')}</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">
            {steps[step].title}
          </h3>
          {steps[step].body}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}

export default Onboarding;
