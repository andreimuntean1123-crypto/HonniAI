'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CupSoda,
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Recipe, RecipeCategory, RecipeFilters, RecipeGroup } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { apiKeyHeader } from '@/lib/apiKey';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useChatDock } from '@/components/chat/ChatDock';
import { PageHeader } from '@/components/layout/PageHeader';
import { CardSkeleton, EmptyState, Reveal } from '@/components/ui';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDetail } from '@/components/recipes/RecipeDetail';
import { FiltersPanel } from '@/components/recipes/FiltersPanel';
import {
  DRINK_CATEGORIES,
  EMPTY_FILTERS,
  FOOD_CATEGORIES,
  RECIPES,
  filterRecipes,
  sortByRelevance,
} from '@/data/recipes';

export default function RecipesPage() {
  const { t, locale } = useI18n();
  const { data, addSearch, cacheRecipe } = useData();
  const { toast } = useToast();
  const { open: openChat } = useChatDock();

  const [group, setGroup] = useState<RecipeGroup | null>(null);
  const [category, setCategory] = useState<RecipeCategory | null>(null);
  const [filters, setFilters] = useState<RecipeFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Recipe[]>([]);

  const pool = useMemo(() => [...generated, ...RECIPES], [generated]);

  const results = useMemo(() => {
    const filtered = filterRecipes(pool, filters, locale, group ?? undefined, category);
    return sortByRelevance(filtered, filters.pantry, locale);
  }, [pool, filters, locale, group, category]);

  const activeFilterCount =
    (filters.maxTotalMinutes ? 1 : 0) +
    (filters.maxCalories ? 1 : 0) +
    (filters.difficulty ? 1 : 0) +
    (filters.budget ? 1 : 0) +
    (filters.cuisine ? 1 : 0) +
    (filters.mealSlot ? 1 : 0) +
    filters.diets.length +
    filters.pantry.length;

  const categories = group === 'drink' ? DRINK_CATEGORIES : FOOD_CATEGORIES;

  const runSearch = (value: string) => {
    setFilters((f) => ({ ...f, query: value }));
    if (value.trim().length > 2) {
      addSearch({ query: value.trim(), group, category });
    }
  };

  /** Asks the agent for a full recipe when the library has no match. */
  const generateWithAi = async () => {
    if (!filters.query.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...apiKeyHeader() },
        body: JSON.stringify({
          query: filters.query,
          locale,
          userContext: data.profile.aiContext,
        }),
        signal: AbortSignal.timeout(65_000),
      });
      const json = (await res.json()) as { recipe: Recipe | null; demo?: boolean };

      if (json.recipe) {
        setGenerated((prev) => [json.recipe as Recipe, ...prev]);
        cacheRecipe(json.recipe);
        setDetail(json.recipe);
      } else {
        // Demo mode: hand the request to the chef agent instead.
        openChat({
          agent: 'chef',
          autoSend:
            locale === 'ro'
              ? `Dă-mi o rețetă completă pentru: ${filters.query}`
              : locale === 'ru'
                ? `Дай полный рецепт: ${filters.query}`
                : `Give me a complete recipe for: ${filters.query}`,
        });
      }
    } catch {
      toast(t('errors.network'), 'error');
    } finally {
      setGenerating(false);
    }
  };

  /* ----------------------------------------------------------- group chooser */
  if (!group) {
    return (
      <div className="container-page pb-16">
        <PageHeader title={t('recipes.title')} subtitle={t('recipes.subtitle')} />

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              {
                id: 'food' as const,
                icon: UtensilsCrossed,
                title: t('recipes.groupFood'),
                desc: t('recipes.groupFoodDesc'),
                emojis: ['🍕', '🍲', '🥗', '🍰'],
                gradient: 'from-amber-400/25 to-red-500/20',
              },
              {
                id: 'drink' as const,
                icon: CupSoda,
                title: t('recipes.groupDrink'),
                desc: t('recipes.groupDrinkDesc'),
                emojis: ['🥤', '☕', '🍹', '🍋'],
                gradient: 'from-brand-400/25 to-sky-500/20',
              },
            ] as const
          ).map((item, i) => (
            <Reveal key={item.id} delay={i * 0.08}>
              <button
                onClick={() => setGroup(item.id)}
                className="card card-hover group w-full overflow-hidden p-0 text-left"
              >
                <div
                  className={clsx(
                    'relative flex h-40 items-center justify-center gap-3 bg-gradient-to-br',
                    item.gradient,
                  )}
                >
                  {item.emojis.map((e, j) => (
                    <motion.span
                      key={e}
                      className="text-4xl sm:text-5xl"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 3 + j * 0.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: j * 0.2,
                      }}
                    >
                      {e}
                    </motion.span>
                  ))}
                </div>
                <div className="p-5">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink">
                    <item.icon size={18} className="text-brand-500" />
                    {item.title}
                  </h2>
                  <p className="muted mt-1.5 text-[0.85rem]">{item.desc}</p>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------- category chooser */
  if (!category) {
    return (
      <div className="container-page pb-16">
        <PageHeader
          title={group === 'food' ? t('recipes.groupFood') : t('recipes.groupDrink')}
          subtitle={t('recipes.chooseCategory')}
          action={
            <button onClick={() => setGroup(null)} className="btn-ghost btn-sm">
              <ArrowLeft size={14} />
              {t('common.back')}
            </button>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.03}>
              <button
                onClick={() => setCategory(cat.id)}
                className="card card-hover flex w-full flex-col items-center gap-2.5 px-3 py-6 text-center"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-[0.82rem] font-medium text-ink">
                  {t(`categories.${cat.id}`)}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- results */
  return (
    <div className="container-page pb-16">
      <PageHeader
        title={t(`categories.${category}`)}
        subtitle={`${t('recipes.searchIn')} ${
          group === 'food' ? t('recipes.groupFood') : t('recipes.groupDrink')
        }`}
        action={
          <button onClick={() => setCategory(null)} className="btn-ghost btn-sm">
            <ArrowLeft size={14} />
            {t('common.back')}
          </button>
        }
      />

      {/* search bar */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-4 bg-surface/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              value={filters.query}
              onChange={(e) => runSearch(e.target.value)}
              placeholder={t('recipes.searchPlaceholder')}
              className="input py-3 pl-11 pr-10 text-[0.95rem]"
              autoComplete="off"
            />
            {filters.query && (
              <button
                onClick={() => runSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                aria-label={t('common.reset')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen(true)}
            className={clsx('btn-secondary relative shrink-0 px-4', activeFilterCount && 'ring-neon')}
            aria-label={t('common.filters')}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">{t('common.filters')}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* recent searches */}
        {!filters.query && data.searches.length > 0 && (
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            {data.searches.slice(0, 6).map((s) => (
              <button
                key={s.id}
                onClick={() => runSearch(s.query)}
                className="chip shrink-0 whitespace-nowrap"
              >
                {s.query}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* results */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-muted">
          {results.length} {t('common.results')}
          {filters.query && (
            <>
              {' · '}
              {t('recipes.resultsFor')} “{filters.query}”
            </>
          )}
        </p>
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ ...EMPTY_FILTERS, query: filters.query })}
            className="text-xs text-brand-600 hover:underline dark:text-brand-400"
          >
            {t('common.clearFilters')}
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {generating ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : results.length ? (
          <motion.div
            layout
            className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {results.map((recipe, i) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={i} onOpen={setDetail} />
            ))}
          </motion.div>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon={<Search size={26} />}
              title={t('common.noResults')}
              text={filters.query ? t('recipes.notFoundAskAI') : t('common.noResultsHint')}
              action={
                filters.query ? (
                  <button onClick={generateWithAi} className="btn-primary btn-sm mt-2">
                    <Sparkles size={14} />
                    {t('recipes.generateWithAI')}
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </AnimatePresence>

      {/* always-available AI generation */}
      {results.length > 0 && filters.query.trim().length > 2 && (
        <div className="mt-6 flex justify-center">
          <button onClick={generateWithAi} disabled={generating} className="btn-secondary btn-sm">
            {generating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generating ? t('recipes.generatingWithAI') : t('recipes.generateWithAI')}
          </button>
        </div>
      )}

      <FiltersPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
      />

      <RecipeDetail recipe={detail} open={Boolean(detail)} onClose={() => setDetail(null)} />
    </div>
  );
}
