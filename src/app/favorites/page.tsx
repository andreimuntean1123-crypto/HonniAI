'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Heart, MessagesSquare, Search, Soup, Salad, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Recipe } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useChatDock } from '@/components/chat/ChatDock';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState, Segmented } from '@/components/ui';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDetail } from '@/components/recipes/RecipeDetail';
import { getCuisine } from '@/data/cuisines';

type Tab = 'recipes' | 'plans' | 'cuisines' | 'analyses' | 'chats' | 'searches';
type Sort = 'newest' | 'oldest' | 'name';

export default function FavoritesPage() {
  const { t, locale } = useI18n();
  const {
    data,
    deletePlan,
    deleteAnalysis,
    deleteConversation,
    clearSearches,
  } = useData();
  const { toast } = useToast();
  const { open: openChat } = useChatDock();

  const [tab, setTab] = useState<Tab>('recipes');
  const [sort, setSort] = useState<Sort>('newest');
  const [detail, setDetail] = useState<Recipe | null>(null);

  const favorites = useMemo(() => {
    const list = data.savedRecipes.filter((r) => data.favorites.includes(r.id));
    if (sort === 'name') {
      return [...list].sort((a, b) => a.title[locale].localeCompare(b.title[locale]));
    }
    const ordered = data.favorites
      .map((id) => list.find((r) => r.id === id))
      .filter((r): r is Recipe => Boolean(r));
    return sort === 'newest' ? ordered : [...ordered].reverse();
  }, [data.favorites, data.savedRecipes, locale, sort]);

  const byDate = <T extends { createdAt: number }>(items: T[]) =>
    [...items].sort((a, b) =>
      sort === 'oldest' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt,
    );

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'recipes', label: t('favorites.tabRecipes'), icon: <Heart size={13} /> },
    { value: 'plans', label: t('favorites.tabPlans'), icon: <Salad size={13} /> },
    { value: 'cuisines', label: t('favorites.tabCuisines'), icon: <Soup size={13} /> },
    { value: 'analyses', label: t('favorites.tabAnalyses'), icon: <Camera size={13} /> },
    { value: 'chats', label: t('favorites.tabChats'), icon: <MessagesSquare size={13} /> },
    { value: 'searches', label: t('favorites.tabSearches'), icon: <Search size={13} /> },
  ];

  return (
    <div className="container-page pb-16">
      <PageHeader
        title={t('favorites.title')}
        subtitle={t('favorites.subtitle')}
        action={
          <Segmented
            value={sort}
            onChange={setSort}
            options={[
              { value: 'newest', label: t('favorites.sortNewest') },
              { value: 'oldest', label: t('favorites.sortOldest') },
              { value: 'name', label: t('favorites.sortName') },
            ]}
          />
        }
      />

      {/* tabs */}
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((item) => (
          <button
            key={item.value}
            onClick={() => setTab(item.value)}
            className={clsx('chip shrink-0 whitespace-nowrap', tab === item.value && 'chip-active')}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {/* ------------------------------------------------------ recipes */}
            {tab === 'recipes' &&
              (favorites.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {favorites.map((recipe, i) => (
                    <RecipeCard key={recipe.id} recipe={recipe} index={i} onOpen={setDetail} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Heart size={26} />}
                  title={t('favorites.emptyRecipes')}
                  action={
                    <Link href="/recipes" className="btn-primary btn-sm mt-2">
                      {t('nav.recipes')}
                    </Link>
                  }
                />
              ))}

            {/* -------------------------------------------------------- plans */}
            {tab === 'plans' &&
              (data.plans.length ? (
                <ul className="space-y-2">
                  {byDate(data.plans).map((plan) => (
                    <li key={plan.id} className="card flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">
                          {plan.title || t('planner.planTitle')}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {new Date(plan.createdAt).toLocaleString()} · {plan.days.length}{' '}
                          {t('planner.day').toLowerCase()} · {plan.targetCalories}{' '}
                          {t('common.kcal')}
                        </p>
                        <p className="muted mt-1 line-clamp-1 text-xs">
                          {plan.days[0]?.meals.map((m) => m.title).join(' · ')}
                        </p>
                      </div>
                      <Link href="/planner" className="btn-secondary btn-sm shrink-0">
                        {t('common.edit')}
                      </Link>
                      <button
                        onClick={() => {
                          deletePlan(plan.id);
                          toast(t('toast.planDeleted'));
                        }}
                        className="icon-btn h-8 w-8 shrink-0"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<Salad size={26} />}
                  title={t('favorites.emptyPlans')}
                  action={
                    <Link href="/planner" className="btn-primary btn-sm mt-2">
                      {t('nav.planner')}
                    </Link>
                  }
                />
              ))}

            {/* ----------------------------------------------------- cuisines */}
            {tab === 'cuisines' &&
              (data.exploredCuisines.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.exploredCuisines.map((id) => {
                    const cuisine = getCuisine(id);
                    if (!cuisine) return null;
                    return (
                      <Link key={id} href={`/cuisines/${id}`} className="chip">
                        {cuisine.flag} {cuisine.name[locale]}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<Soup size={26} />}
                  title={t('favorites.emptyCuisines')}
                  action={
                    <Link href="/cuisines" className="btn-primary btn-sm mt-2">
                      {t('nav.cuisines')}
                    </Link>
                  }
                />
              ))}

            {/* ----------------------------------------------------- analyses */}
            {tab === 'analyses' &&
              (data.analyses.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {byDate(data.analyses).map((a) => (
                    <div key={a.id} className="card overflow-hidden">
                      {a.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.thumbnail} alt="" className="h-32 w-full object-cover" />
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-surface-2 text-3xl">
                          🍽️
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-medium text-ink">{a.dish}</p>
                        <p className="text-xs text-ink-muted">
                          {a.nutrition.calories} {t('common.kcal')} ·{' '}
                          {t('analyze.score')} {a.healthScore}/100
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Link href="/analyze" className="btn-secondary btn-sm">
                            {t('common.seeAll')}
                          </Link>
                          <button
                            onClick={() => deleteAnalysis(a.id)}
                            className="icon-btn h-8 w-8"
                            aria-label={t('common.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Camera size={26} />}
                  title={t('favorites.emptyAnalyses')}
                  action={
                    <Link href="/analyze" className="btn-primary btn-sm mt-2">
                      {t('nav.analyze')}
                    </Link>
                  }
                />
              ))}

            {/* -------------------------------------------------------- chats */}
            {tab === 'chats' &&
              (data.conversations.length ? (
                <ul className="space-y-2">
                  {[...data.conversations]
                    .sort((a, b) =>
                      sort === 'oldest' ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt,
                    )
                    .map((c) => (
                      <li key={c.id} className="card flex items-center gap-4 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-ink">{c.title}</p>
                          <p className="text-xs text-ink-muted">
                            {t(`agents.${c.agent}Name`)} ·{' '}
                            {new Date(c.updatedAt).toLocaleString()} · {c.messages.length}
                          </p>
                        </div>
                        <button
                          onClick={() => openChat({ agent: c.agent })}
                          className="btn-secondary btn-sm shrink-0"
                        >
                          {t('agents.openChat')}
                        </button>
                        <button
                          onClick={() => {
                            deleteConversation(c.id);
                            toast(t('toast.itemDeleted'));
                          }}
                          className="icon-btn h-8 w-8 shrink-0"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <EmptyState icon={<MessagesSquare size={26} />} title={t('favorites.emptyChats')} />
              ))}

            {/* ----------------------------------------------------- searches */}
            {tab === 'searches' &&
              (data.searches.length ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {data.searches.map((s) => (
                      <Link key={s.id} href="/recipes" className="chip">
                        <Search size={12} />
                        {s.query}
                      </Link>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      clearSearches();
                      toast(t('toast.historyCleared'));
                    }}
                    className="btn-ghost btn-sm mt-4 text-red-500"
                  >
                    <Trash2 size={13} />
                    {t('common.deleteAll')}
                  </button>
                </>
              ) : (
                <EmptyState icon={<Search size={26} />} title={t('favorites.emptySearches')} />
              ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <RecipeDetail recipe={detail} open={Boolean(detail)} onClose={() => setDetail(null)} />
    </div>
  );
}
