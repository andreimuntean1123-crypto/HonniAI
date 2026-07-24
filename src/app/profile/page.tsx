'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, LogIn, Save, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import type { DietTag, PlanGoal } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal, Stat, TagInput } from '@/components/ui';
import { AuthModal } from '@/components/auth/AuthModal';
import { CUISINES } from '@/data/cuisines';

const GOALS: PlanGoal[] = ['maintain', 'lose', 'gain', 'muscle', 'healthier'];
const DIETS: DietTag[] = ['vegetarian', 'vegan', 'gluten-free', 'lactose-free', 'halal'];

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { user, updateUser } = useAuth();
  const { data, updateProfile } = useData();
  const { toast } = useToast();

  const [authOpen, setAuthOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [form, setForm] = useState(data.profile);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => setForm(data.profile), [data.profile]);
  useEffect(() => setName(user?.name ?? ''), [user?.name]);

  const save = () => {
    updateProfile(form);
    if (user && name.trim()) updateUser({ name: name.trim() });
    toast(t('toast.profileUpdated'));
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => updateUser({ picture: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="container-page pb-16">
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        action={
          <button onClick={save} className="btn-primary btn-sm">
            <Save size={14} />
            {t('profile.saveChanges')}
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* -------------------------------------------------------- account */}
        <Reveal className="space-y-5">
          <div className="card p-5">
            <p className="label">{t('profile.account')}</p>

            {user ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-2 font-display text-xl font-semibold text-ink">
                      {user.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.picture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        user.name.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <button
                      onClick={() => photoRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-black shadow-soft"
                      aria-label={t('profile.changePhoto')}
                    >
                      <Camera size={13} />
                    </button>
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => pickPhoto(e.target.files?.[0])}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{user.name}</p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-400">
                      {user.provider}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="label" htmlFor="display-name">
                    {t('profile.displayName')}
                  </label>
                  <input
                    id="display-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="muted text-sm">{t('profile.signInPrompt')}</p>
                <button onClick={() => setAuthOpen(true)} className="btn-primary btn-sm mt-3">
                  <LogIn size={14} />
                  {t('common.signIn')}
                </button>
              </div>
            )}
          </div>

          <div className="card p-5">
            <p className="label">{t('profile.stats')}</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat label={t('profile.statFavorites')} value={data.favorites.length} accent />
              <Stat label={t('profile.statPlans')} value={data.plans.length} />
              <Stat label={t('profile.statAnalyses')} value={data.analyses.length} />
              <Stat label={t('profile.statChats')} value={data.conversations.length} />
            </div>
            <Link href="/favorites" className="btn-secondary btn-sm mt-4 w-full justify-center">
              {t('favorites.title')}
            </Link>
          </div>
        </Reveal>

        {/* ---------------------------------------------------- preferences */}
        <Reveal delay={0.06} className="space-y-5">
          <div className="card space-y-5 p-5">
            <p className="label !mb-0">{t('profile.preferences')}</p>

            <div>
              <p className="label">{t('planner.allergies')}</p>
              <TagInput
                value={form.allergies}
                onChange={(allergies) => setForm({ ...form, allergies })}
              />
            </div>
            <div>
              <p className="label">{t('planner.intolerances')}</p>
              <TagInput
                value={form.intolerances}
                onChange={(intolerances) => setForm({ ...form, intolerances })}
              />
            </div>
            <div>
              <p className="label">{t('planner.disliked')}</p>
              <TagInput
                value={form.disliked}
                onChange={(disliked) => setForm({ ...form, disliked })}
              />
            </div>
            <div>
              <p className="label">{t('planner.favoriteFoods')}</p>
              <TagInput
                value={form.favoriteFoods}
                onChange={(favoriteFoods) => setForm({ ...form, favoriteFoods })}
              />
            </div>

            <div>
              <p className="label">{t('planner.cuisines')}</p>
              <div className="flex flex-wrap gap-1.5">
                {CUISINES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      setForm({
                        ...form,
                        favoriteCuisines: form.favoriteCuisines.includes(c.id)
                          ? form.favoriteCuisines.filter((x) => x !== c.id)
                          : [...form.favoriteCuisines, c.id],
                      })
                    }
                    className={clsx(
                      'chip',
                      form.favoriteCuisines.includes(c.id) && 'chip-active',
                    )}
                  >
                    {c.flag} {c.name[locale]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">{t('planner.diets')}</p>
              <div className="flex flex-wrap gap-1.5">
                {DIETS.map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setForm({
                        ...form,
                        diets: form.diets.includes(d)
                          ? form.diets.filter((x) => x !== d)
                          : [...form.diets, d],
                      })
                    }
                    className={clsx('chip', form.diets.includes(d) && 'chip-active')}
                  >
                    {t(`diets.${d}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">{t('planner.goal')}</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setForm({ ...form, goal: null })}
                  className={clsx('chip', !form.goal && 'chip-active')}
                >
                  {t('profile.goalNone')}
                </button>
                {GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setForm({ ...form, goal: g })}
                    className={clsx('chip', form.goal === g && 'chip-active')}
                  >
                    {t(`planner.goal${g.charAt(0).toUpperCase()}${g.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">
                {t('planner.cookingTime')}: {form.maxCookingMinutes ?? 40}
              </p>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={form.maxCookingMinutes ?? 40}
                onChange={(e) =>
                  setForm({ ...form, maxCookingMinutes: Number(e.target.value) })
                }
                className="w-full accent-[rgb(var(--brand-500))]"
              />
            </div>

            <button onClick={save} className="btn-primary w-full justify-center py-3">
              <Save size={15} />
              {t('profile.saveChanges')}
            </button>
          </div>

          {/* generated agent context */}
          <div className="card p-5">
            <p className="label flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand-500" />
              {t('profile.aiContext')}
            </p>
            <p className="mb-3 text-xs text-ink-muted">{t('profile.aiContextHint')}</p>
            <p className="rounded-2xl border border-brand-500/25 bg-brand-500/[0.07] px-4 py-3 text-sm leading-relaxed text-ink">
              {data.profile.aiContext || t('common.empty')}
            </p>
          </div>
        </Reveal>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
