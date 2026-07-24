'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Droplets,
  Loader2,
  Pencil,
  Printer,
  RefreshCw,
  Repeat,
  Save,
  ShoppingBasket,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import type {
  ActivityLevel,
  DietTag,
  MealPlan,
  PlanGoal,
  PlanMeal,
  PlannerInput,
  Sex,
} from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { MacroBar, Reveal, Stat, TagInput } from '@/components/ui';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CUISINES } from '@/data/cuisines';
import { RECIPES } from '@/data/recipes';
import { buildLocalPlan } from '@/lib/demo';
import { planToText } from '@/lib/planUtils';
import { sumNutrition } from '@/lib/nutrition';

const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'athlete'];
const GOALS: PlanGoal[] = ['maintain', 'lose', 'gain', 'muscle', 'healthier'];
const SEXES: Sex[] = ['female', 'male', 'unspecified'];
const DIETS: DietTag[] = ['vegetarian', 'vegan', 'gluten-free', 'lactose-free', 'halal'];

const EQUIPMENT_KEYS: Record<string, [string, string, string]> = {
  oven: ['Cuptor', 'Духовка', 'Oven'],
  stove: ['Aragaz', 'Плита', 'Stove'],
  microwave: ['Cuptor cu microunde', 'Микроволновка', 'Microwave'],
  blender: ['Blender', 'Блендер', 'Blender'],
  airfryer: ['Air fryer', 'Аэрофритюрница', 'Air fryer'],
  grill: ['Grătar', 'Гриль', 'Grill'],
};

export default function PlannerPage() {
  const { t, locale } = useI18n();
  const { data, savePlan, deletePlan, addShoppingItems, updateProfile } = useData();
  const { toast } = useToast();

  const [input, setInput] = useState<PlannerInput>(() => ({
    age: 28,
    heightCm: 172,
    weightKg: 68,
    sex: 'unspecified',
    activity: 'moderate',
    goal: data.profile.goal ?? 'maintain',
    mealsPerDay: 5,
    allergies: data.profile.allergies,
    intolerances: data.profile.intolerances,
    excluded: [],
    disliked: data.profile.disliked,
    favoriteCuisines: data.profile.favoriteCuisines,
    favoriteFoods: data.profile.favoriteFoods,
    budget: 'medium',
    cookingMinutes: data.profile.maxCookingMinutes ?? 40,
    equipment: ['stove', 'oven'],
    days: 1,
    diets: data.profile.diets,
  }));

  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ dayId: string; mealId: string } | null>(null);
  const [draft, setDraft] = useState('');

  const set = <K extends keyof PlannerInput>(key: K, value: PlannerInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const isMinor = input.age < 18;
  const bmi = input.weightKg / Math.pow(input.heightCm / 100, 2);
  const showCaution = isMinor || bmi < 18.5 || input.allergies.length > 0;

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input, locale, userContext: data.profile.aiContext }),
      });
      const json = (await res.json()) as { plan: MealPlan | null };

      // Local generation is used in demo mode and as a fallback.
      const next =
        json.plan && json.plan.days.length
          ? {
              ...json.plan,
              title: `${t('planner.planTitle')} · ${t(
                `planner.goal${input.goal.charAt(0).toUpperCase()}${input.goal.slice(1)}`,
              )}`,
            }
          : buildLocalPlan(input, locale, t);

      setPlan(next);
      // Keep the profile in sync with what the user just told the planner.
      updateProfile({
        goal: input.goal,
        allergies: input.allergies,
        intolerances: input.intolerances,
        disliked: input.disliked,
        favoriteCuisines: input.favoriteCuisines,
        favoriteFoods: input.favoriteFoods,
        maxCookingMinutes: input.cookingMinutes,
        diets: input.diets,
      });
    } catch {
      setPlan(buildLocalPlan(input, locale, t));
      toast(t('common.demoMode'), 'info');
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------- plan mutations */

  const replaceMeal = (dayId: string, meal: PlanMeal) => {
    if (!meal.alternatives.length) {
      toast(t('common.noResults'), 'info');
      return;
    }
    const [next, ...rest] = meal.alternatives;
    // If the alternative exists in the library, swap in its full data; otherwise
    // drop the details that belonged to the previous dish so nothing is stale.
    const replacement = RECIPES.find((r) => r.title[locale] === next);

    updateMeal(dayId, meal.id, {
      title: next,
      alternatives: [...rest, meal.title],
      description: replacement ? replacement.description[locale] : '',
      quantity: replacement ? `1 × ${t('common.portion')}` : meal.quantity,
      nutrition: replacement ? replacement.nutrition : meal.nutrition,
      recipeId: replacement?.id,
    });
    toast(t('common.saved'));
  };

  const updateMeal = (dayId: string, mealId: string, patch: Partial<PlanMeal>) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((day) => {
        if (day.id !== dayId) return day;
        const meals = day.meals.map((m) => (m.id === mealId ? { ...m, ...patch } : m));
        return { ...day, meals, totals: sumNutrition(meals.map((m) => m.nutrition)) };
      });
      return { ...prev, days };
    });
  };

  const regenerateDay = (dayIndex: number) => {
    const fresh = buildLocalPlan({ ...input, days: 7 }, locale, t);
    const replacement = fresh.days[(dayIndex + 1) % fresh.days.length];
    setPlan((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((d, i) =>
        i === dayIndex ? { ...replacement, id: d.id, dayIndex: d.dayIndex, label: d.label } : d,
      );
      return { ...prev, days };
    });
    toast(t('common.regenerate'));
  };

  const addDayToList = (dayIndex: number) => {
    const day = plan?.days[dayIndex];
    if (!day) return;
    addShoppingItems(
      day.meals.map((m) => ({
        name: m.title,
        amount: null,
        unit: null,
        category: 'other' as const,
        source: `${plan?.title ?? ''} · ${day.label}`,
      })),
    );
    toast(t('toast.addedToList'));
  };

  const exportPlan = () => {
    if (!plan) return;
    const text = planToText(plan, t);
    const win = window.open('', '_blank');
    if (!win) {
      void navigator.clipboard?.writeText(text);
      toast(t('toast.copiedLink'));
      return;
    }
    win.document.write(
      `<pre style="font:14px/1.6 ui-monospace,monospace;padding:32px;white-space:pre-wrap">${text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</pre>`,
    );
    win.document.title = plan.title || 'Honni AI';
    win.document.close();
    win.print();
    toast(t('toast.exported'));
  };

  const chatNote = useMemo(() => {
    if (!plan) return undefined;
    return `Current plan: ${plan.days
      .map((d) => `${d.label}: ${d.meals.map((m) => m.title).join(', ')}`)
      .join(' | ')}. Target ${plan.targetCalories} kcal.`;
  }, [plan]);

  return (
    <div className="container-page pb-16">
      <PageHeader title={t('planner.title')} subtitle={t('planner.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-[24rem_minmax(0,1fr)]">
        {/* ------------------------------------------------------------ form */}
        <Reveal className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
          <form
            className="card space-y-5 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void generate();
            }}
          >
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
              {t('planner.formTitle')}
            </h2>

            <div className="grid grid-cols-3 gap-2">
              <Field label={t('planner.age')}>
                <input
                  type="number"
                  min={10}
                  max={100}
                  className="input"
                  value={input.age}
                  onChange={(e) => set('age', Number(e.target.value))}
                  required
                />
              </Field>
              <Field label={t('planner.height')}>
                <input
                  type="number"
                  min={100}
                  max={230}
                  className="input"
                  value={input.heightCm}
                  onChange={(e) => set('heightCm', Number(e.target.value))}
                  required
                />
              </Field>
              <Field label={t('planner.weight')}>
                <input
                  type="number"
                  min={30}
                  max={250}
                  className="input"
                  value={input.weightKg}
                  onChange={(e) => set('weightKg', Number(e.target.value))}
                  required
                />
              </Field>
            </div>

            <Field label={`${t('planner.sex')} (${t('common.optional')})`}>
              <div className="flex flex-wrap gap-1.5">
                {SEXES.map((s) => (
                  <Chip key={s} active={input.sex === s} onClick={() => set('sex', s)}>
                    {t(`planner.sex${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label={t('planner.activity')}>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITIES.map((a) => (
                  <Chip key={a} active={input.activity === a} onClick={() => set('activity', a)}>
                    {t(`planner.activity${a.charAt(0).toUpperCase()}${a.slice(1)}`)}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label={t('planner.goal')}>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map((g) => (
                  <Chip key={g} active={input.goal === g} onClick={() => set('goal', g)}>
                    {t(`planner.goal${g.charAt(0).toUpperCase()}${g.slice(1)}`)}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label={`${t('planner.meals')}: ${input.mealsPerDay}`}>
              <input
                type="range"
                min={2}
                max={6}
                value={input.mealsPerDay}
                onChange={(e) => set('mealsPerDay', Number(e.target.value))}
                className="w-full accent-[rgb(var(--brand-500))]"
              />
            </Field>

            <Field label={t('planner.allergies')}>
              <TagInput value={input.allergies} onChange={(v) => set('allergies', v)} />
            </Field>
            <Field label={t('planner.intolerances')}>
              <TagInput value={input.intolerances} onChange={(v) => set('intolerances', v)} />
            </Field>
            <Field label={t('planner.excluded')}>
              <TagInput value={input.excluded} onChange={(v) => set('excluded', v)} />
            </Field>
            <Field label={t('planner.disliked')}>
              <TagInput value={input.disliked} onChange={(v) => set('disliked', v)} />
            </Field>
            <Field label={t('planner.favoriteFoods')}>
              <TagInput value={input.favoriteFoods} onChange={(v) => set('favoriteFoods', v)} />
            </Field>

            <Field label={t('planner.cuisines')}>
              <div className="flex flex-wrap gap-1.5">
                {CUISINES.map((c) => (
                  <Chip
                    key={c.id}
                    active={input.favoriteCuisines.includes(c.id)}
                    onClick={() =>
                      set(
                        'favoriteCuisines',
                        input.favoriteCuisines.includes(c.id)
                          ? input.favoriteCuisines.filter((x) => x !== c.id)
                          : [...input.favoriteCuisines, c.id],
                      )
                    }
                  >
                    {c.flag} {c.name[locale]}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label={t('planner.budget')}>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high'] as const).map((b) => (
                  <Chip key={b} active={input.budget === b} onClick={() => set('budget', b)}>
                    {t(`filters.budget${b.charAt(0).toUpperCase()}${b.slice(1)}`)}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label={`${t('planner.cookingTime')}: ${input.cookingMinutes}`}>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={input.cookingMinutes}
                onChange={(e) => set('cookingMinutes', Number(e.target.value))}
                className="w-full accent-[rgb(var(--brand-500))]"
              />
            </Field>

            <Field label={t('planner.equipment')}>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(EQUIPMENT_KEYS).map(([key, labels]) => (
                  <Chip
                    key={key}
                    active={input.equipment.includes(key)}
                    onClick={() =>
                      set(
                        'equipment',
                        input.equipment.includes(key)
                          ? input.equipment.filter((x) => x !== key)
                          : [...input.equipment, key],
                      )
                    }
                  >
                    {labels[locale === 'ro' ? 0 : locale === 'ru' ? 1 : 2]}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label={t('planner.diets')}>
              <div className="flex flex-wrap gap-1.5">
                {DIETS.map((d) => (
                  <Chip
                    key={d}
                    active={input.diets.includes(d)}
                    onClick={() =>
                      set(
                        'diets',
                        input.diets.includes(d)
                          ? input.diets.filter((x) => x !== d)
                          : [...input.diets, d],
                      )
                    }
                  >
                    {t(`diets.${d}`)}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label={t('planner.days')}>
              <div className="flex gap-1.5">
                <Chip active={input.days === 1} onClick={() => set('days', 1)}>
                  {t('planner.dayOne')}
                </Chip>
                <Chip active={input.days === 7} onClick={() => set('days', 7)}>
                  {t('planner.week')}
                </Chip>
              </div>
            </Field>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? t('planner.generating') : t('planner.generate')}
            </button>

            {showCaution && (
              <p className="flex items-start gap-2 rounded-2xl bg-amber-500/[0.08] px-3.5 py-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                {t('planner.minorWarning')}
              </p>
            )}
          </form>
        </Reveal>

        {/* ------------------------------------------------------------ plan */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card space-y-4 p-6"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full" />
                ))}
              </motion.div>
            )}

            {!loading && plan && (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* summary */}
                <div className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="label !mb-1">{t('planner.goalLabel')}</p>
                      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                        {t(
                          `planner.goal${plan.goal.charAt(0).toUpperCase()}${plan.goal.slice(1)}`,
                        )}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          savePlan(plan);
                          toast(t('toast.planSaved'));
                        }}
                        className="btn-secondary btn-sm"
                      >
                        <Save size={14} />
                        {t('planner.savePlan')}
                      </button>
                      <button onClick={exportPlan} className="btn-secondary btn-sm">
                        <Printer size={14} />
                        {t('planner.exportPlan')}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="label">{t('planner.needs')}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Stat
                        label={t('recipes.calories')}
                        value={plan.targetCalories}
                        suffix={t('common.kcal')}
                        accent
                      />
                      <Stat label={t('recipes.protein')} value={plan.macroTargets.protein} suffix="g" />
                      <Stat label={t('recipes.carbs')} value={plan.macroTargets.carbs} suffix="g" />
                      <Stat label={t('recipes.fat')} value={plan.macroTargets.fat} suffix="g" />
                    </div>
                    <div className="mt-3">
                      <MacroBar
                        protein={plan.macroTargets.protein}
                        carbs={plan.macroTargets.carbs}
                        fat={plan.macroTargets.fat}
                        labels={[t('recipes.protein'), t('recipes.carbs'), t('recipes.fat')]}
                      />
                    </div>
                  </div>
                </div>

                {/* days */}
                {plan.days.map((day, dayIndex) => (
                  <div key={day.id} className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-5 py-3.5">
                      <h3 className="font-display text-base font-semibold text-ink">{day.label}</h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="badge">
                          {day.totals.calories} {t('common.kcal')}
                        </span>
                        <span className="badge">
                          <Droplets size={11} />
                          {day.waterMl} ml
                        </span>
                        <button
                          onClick={() => regenerateDay(dayIndex)}
                          className="icon-btn h-8 w-8"
                          title={t('planner.regenerateDay')}
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={() => addDayToList(dayIndex)}
                          className="icon-btn h-8 w-8"
                          title={t('planner.addDayToList')}
                        >
                          <ShoppingBasket size={14} />
                        </button>
                      </div>
                    </div>

                    <ul className="divide-y divide-hairline">
                      {day.meals.map((meal) => {
                        const slotKey = meal.slot === 'snack2' ? 'snack' : meal.slot;
                        const isEditing =
                          editing?.dayId === day.id && editing?.mealId === meal.id;
                        return (
                          <li key={meal.id} className="px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-400">
                                  {t(`planner.${slotKey}`)}
                                </p>

                                {isEditing ? (
                                  <div className="mt-1.5 flex gap-2">
                                    <input
                                      className="input py-2"
                                      value={draft}
                                      onChange={(e) => setDraft(e.target.value)}
                                      placeholder={t('planner.editPlaceholder')}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        updateMeal(day.id, meal.id, { title: draft });
                                        setEditing(null);
                                      }}
                                      className="btn-primary btn-sm"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <p className="mt-0.5 font-medium text-ink">{meal.title}</p>
                                )}

                                {meal.description && (
                                  <p className="muted mt-1 text-[0.82rem]">{meal.description}</p>
                                )}
                                {meal.quantity && (
                                  <p className="mt-1 text-xs text-ink-muted">{meal.quantity}</p>
                                )}

                                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-muted">
                                  <span className="badge">
                                    {meal.nutrition.calories} {t('common.kcal')}
                                  </span>
                                  <span className="badge">P {meal.nutrition.protein} g</span>
                                  <span className="badge">C {meal.nutrition.carbs} g</span>
                                  <span className="badge">F {meal.nutrition.fat} g</span>
                                </div>

                                {meal.alternatives.length > 0 && (
                                  <p className="mt-2 text-[11px] text-ink-muted">
                                    {t('planner.alternatives')}: {meal.alternatives.join(' · ')}
                                  </p>
                                )}
                              </div>

                              <div className="flex shrink-0 gap-1">
                                <button
                                  onClick={() => replaceMeal(day.id, meal)}
                                  className="icon-btn h-8 w-8"
                                  title={t('planner.replaceMeal')}
                                >
                                  <Repeat size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditing({ dayId: day.id, mealId: meal.id });
                                    setDraft(meal.title);
                                  }}
                                  className="icon-btn h-8 w-8"
                                  title={t('planner.editMeal')}
                                >
                                  <Pencil size={14} />
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                {plan.notes.length > 0 && (
                  <div className="card p-5">
                    <p className="label">{t('planner.advice')}</p>
                    <ul className="space-y-2">
                      {plan.notes.map((note, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-ink-soft">
                          <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="flex items-start gap-2 rounded-2xl bg-amber-500/[0.08] px-4 py-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  {t('planner.disclaimer')} {t('planner.minorWarning')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* chat with the planner agent */}
          <div className="card flex h-[30rem] flex-col overflow-hidden p-0">
            <ChatPanel agent="nutrition" compact showHistory={false} systemNote={chatNote} />
          </div>

          {/* saved plans */}
          {data.plans.length > 0 && (
            <div className="card p-5">
              <p className="label">{t('planner.savedPlans')}</p>
              <ul className="space-y-2">
                {data.plans.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-hairline px-4 py-3"
                  >
                    <button onClick={() => setPlan(p)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-ink">
                        {p.title || t('planner.planTitle')}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {new Date(p.createdAt).toLocaleDateString()} · {p.days.length}{' '}
                        {t('planner.day').toLowerCase()} · {p.targetCalories} {t('common.kcal')}
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        deletePlan(p.id);
                        toast(t('toast.planDeleted'));
                      }}
                      className="icon-btn h-8 w-8"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={clsx('chip', active && 'chip-active')}>
      {children}
    </button>
  );
}
