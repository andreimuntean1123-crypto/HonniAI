'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  ChefHat,
  Globe2,
  Salad,
  Search,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useChatDock } from '@/components/chat/ChatDock';
import { Reveal } from '@/components/ui';
import { FoodArt } from '@/components/ui/FoodArt';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDetail } from '@/components/recipes/RecipeDetail';
import { LogoMark } from '@/components/brand/Logo';
import { RECIPES } from '@/data/recipes';
import { CUISINES } from '@/data/cuisines';

export default function HomePage() {
  const { t, locale } = useI18n();
  const { open: openChat } = useChatDock();
  const [detail, setDetail] = useState<Recipe | null>(null);

  const popular = [...RECIPES].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8);
  const featuredCuisines = CUISINES.slice(0, 6);

  const heroTitle = t('home.heroTitle').split('\n');

  const features = [
    { icon: Search, title: t('home.feature1Title'), text: t('home.feature1Text') },
    { icon: Camera, title: t('home.feature2Title'), text: t('home.feature2Text') },
    { icon: Salad, title: t('home.feature3Title'), text: t('home.feature3Text') },
    { icon: ShoppingBasket, title: t('home.feature4Title'), text: t('home.feature4Text') },
  ];

  const agents = [
    { id: 'chef' as const, icon: ChefHat, href: '/recipes' },
    { id: 'nutrition' as const, icon: Salad, href: '/planner' },
    { id: 'cuisine' as const, icon: Globe2, href: '/cuisines' },
  ];

  return (
    <>
      {/* ------------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div className="container-page relative pb-10 pt-6 sm:pb-16 sm:pt-10">
          {/* Halo: aceleași culori ca blocul, dar mult mărite și puternic
              neclare, desenate ÎN SPATELE lui. Culoarea „se scurge" în afara
              colțurilor, așa că trecerea de la bloc la pagină nu mai este o
              linie tăiată brusc. Pur decorativ. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 inset-y-8 -z-10 blur-[64px] opacity-60 dark:opacity-45"
            style={{
              background:
                'radial-gradient(60% 55% at 78% 22%, rgba(34,224,74,0.42), transparent 68%), radial-gradient(55% 50% at 14% 82%, rgba(255,190,80,0.30), transparent 66%), radial-gradient(70% 60% at 50% 50%, rgba(13,27,20,0.55), transparent 70%)',
            }}
          />

          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(6,20,12,0.55)] ring-1 ring-black/5 sm:rounded-[2.5rem] dark:ring-white/5">
            {/* layered culinary backdrop */}
            <div className="absolute inset-0">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(135deg, #10251a 0%, #0d1b14 45%, #060a08 100%)',
                }}
              />
              <div
                className="absolute inset-0 opacity-90"
                style={{
                  background:
                    'radial-gradient(65% 60% at 78% 18%, rgba(34,224,74,0.32), transparent 62%), radial-gradient(55% 55% at 12% 88%, rgba(255,190,80,0.22), transparent 60%)',
                }}
              />
              {/* Ingredients float on the right half only, so they never sit
                  behind the headline or the call-to-action buttons. */}
              <div className="absolute inset-0 hidden opacity-30 sm:block">
                {['🥑', '🍅', '🌿', '🍋', '🫒', '🥕', '🧄', '🌶️'].map((emoji, i) => (
                  <motion.span
                    key={emoji}
                    className="absolute text-5xl sm:text-6xl"
                    style={{
                      left: `${[58, 72, 86, 64, 92, 78, 68, 88][i]}%`,
                      top: `${[70, 14, 46, 26, 74, 88, 4, 60][i]}%`,
                    }}
                    animate={{ y: [0, -14, 0], rotate: [0, i % 2 ? 6 : -6, 0] }}
                    transition={{
                      duration: 7 + i,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.4,
                    }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
              <LogoMark
                size={520}
                decorative
                className="absolute -right-24 -top-16 text-white opacity-[0.07]"
              />
            </div>

            <div className="relative px-6 py-16 sm:px-12 sm:py-24 lg:px-16 lg:py-28">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md sm:text-xs"
              >
                <Sparkles size={13} className="text-brand-300" />
                {t('home.heroBadge')}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 max-w-2xl font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]"
              >
                {heroTitle[0]}
                <br />
                <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-200 bg-clip-text text-transparent">
                  {heroTitle[1]}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16 }}
                className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-white/75 sm:text-lg"
              >
                {t('home.heroSubtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24 }}
                className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap"
              >
                <Link href="/recipes" className="btn-primary justify-center py-3 sm:px-6">
                  <Search size={16} />
                  {t('home.ctaRecipes')}
                </Link>
                <Link
                  href="/analyze"
                  className="btn justify-center border border-white/20 bg-white/10 py-3 text-white backdrop-blur-md hover:bg-white/[0.18] sm:px-6"
                >
                  <Camera size={16} />
                  {t('home.ctaAnalyze')}
                </Link>
                <Link
                  href="/cuisines"
                  className="btn justify-center border border-white/20 bg-white/10 py-3 text-white backdrop-blur-md hover:bg-white/[0.18] sm:px-6"
                >
                  <Globe2 size={16} />
                  {t('home.ctaCuisines')}
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-white/70"
              >
                {[
                  { value: `${RECIPES.length}+`, label: t('home.statsRecipes') },
                  { value: CUISINES.length, label: t('home.statsCuisines') },
                  { value: 3, label: t('home.statsAgents') },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-2xl font-semibold text-white">{s.value}</p>
                    <p className="text-[11px] uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- features */}
      <section className="container-page py-8 sm:py-14">
        <Reveal>
          <h2 className="section-title">{t('home.featuresTitle')}</h2>
          <p className="muted mt-2">{t('home.featuresSubtitle')}</p>
        </Reveal>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className="card card-hover h-full p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/[0.12] text-brand-600 dark:text-brand-300">
                  <f.icon size={18} />
                </span>
                <h3 className="mt-3.5 font-display text-[0.95rem] font-semibold text-ink">
                  {f.title}
                </h3>
                <p className="muted mt-1.5 text-[0.83rem]">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- agents */}
      <section className="container-page py-8 sm:py-14">
        <Reveal>
          <h2 className="section-title">{t('home.agentsTitle')}</h2>
          <p className="muted mt-2 max-w-2xl">{t('home.agentsSubtitle')}</p>
        </Reveal>

        <div className="mt-7 grid gap-3 lg:grid-cols-3">
          {agents.map((agent, i) => (
            <Reveal key={agent.id} delay={i * 0.08}>
              <div className="card card-hover flex h-full flex-col p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400/25 to-brand-600/15 text-brand-600 dark:text-brand-300">
                  <agent.icon size={20} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                  {t(`agents.${agent.id}Name`)}
                </h3>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-brand-600 dark:text-brand-400">
                  {t(`agents.${agent.id}Role`)}
                </p>
                <p className="muted mt-3 flex-1 text-[0.88rem]">{t(`agents.${agent.id}Desc`)}</p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => openChat({ agent: agent.id })}
                    className="btn-primary btn-sm"
                  >
                    <Sparkles size={14} />
                    {t('agents.ask')}
                  </button>
                  <Link href={agent.href} className="btn-ghost btn-sm">
                    {t('common.seeAll')}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------- popular */}
      <section className="container-page py-8 sm:py-14">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">{t('home.popularTitle')}</h2>
              <p className="muted mt-2">{t('home.popularSubtitle')}</p>
            </div>
            <Link href="/recipes" className="btn-secondary btn-sm shrink-0">
              {t('common.seeAll')}
              <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={i} onOpen={setDetail} />
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- cuisines */}
      <section className="container-page py-8 sm:py-14">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">{t('home.cuisinesTitle')}</h2>
              <p className="muted mt-2">{t('home.cuisinesSubtitle')}</p>
            </div>
            <Link href="/cuisines" className="btn-secondary btn-sm shrink-0">
              {t('common.seeAll')}
              <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCuisines.map((cuisine, i) => (
            <Reveal key={cuisine.id} delay={i * 0.05}>
              <Link href={`/cuisines/${cuisine.id}`} className="card card-hover flex gap-4 p-4">
                <FoodArt
                  seed={cuisine.id}
                  emoji={cuisine.emoji}
                  gradient={cuisine.gradient}
                  size="sm"
                  className="h-20 w-20 shrink-0"
                  rounded="rounded-2xl"
                />
                <div className="min-w-0">
                  <p className="font-display text-[0.95rem] font-semibold text-ink">
                    {cuisine.flag} {cuisine.name[locale]}
                  </p>
                  <p className="muted mt-1 line-clamp-2 text-[0.8rem]">
                    {cuisine.description[locale]}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- final CTA */}
      <section className="container-page py-10 sm:py-16">
        <Reveal>
          <div className="card relative overflow-hidden px-6 py-12 text-center sm:px-16 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(60% 80% at 50% 0%, rgb(var(--brand-500) / 0.16), transparent 70%)',
              }}
            />
            <LogoMark
              size={64}
              decorative
              className="relative mx-auto text-ink dark:text-white"
            />
            <h2 className="relative mt-5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('home.ctaFinalTitle')}
            </h2>
            <p className="muted relative mx-auto mt-3 max-w-lg">{t('home.ctaFinalText')}</p>
            <button
              onClick={() => openChat({ agent: 'chef' })}
              className="btn-primary relative mt-7 px-7 py-3"
            >
              <UtensilsCrossed size={16} />
              {t('home.ctaFinalButton')}
            </button>
          </div>
        </Reveal>
      </section>

      <RecipeDetail recipe={detail} open={Boolean(detail)} onClose={() => setDetail(null)} />
    </>
  );
}
