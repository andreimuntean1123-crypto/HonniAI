'use client';

import { motion } from 'framer-motion';
import { Clock, Flame, Heart, Star, Users } from 'lucide-react';
import { clsx } from 'clsx';
import type { Recipe } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { FoodArt } from '@/components/ui/FoodArt';
import { totalTime } from '@/data/recipes';

export function RecipeCard({
  recipe,
  onOpen,
  index = 0,
}: {
  recipe: Recipe;
  onOpen: (recipe: Recipe) => void;
  index?: number;
}) {
  const { t, locale } = useI18n();
  const { isFavorite, toggleFavorite } = useData();
  const { toast } = useToast();

  const favorite = isFavorite(recipe.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="card card-hover group flex cursor-pointer flex-col overflow-hidden"
      onClick={() => onOpen(recipe)}
    >
      <div className="relative">
        <FoodArt
          seed={recipe.slug}
          emoji={recipe.emoji}
          image={recipe.image}
          rounded="rounded-none"
          className="h-40 w-full transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            const added = toggleFavorite(recipe);
            toast(added ? t('toast.addedFavorite') : t('toast.removedFavorite'));
          }}
          className={clsx(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all',
            favorite
              ? 'bg-white/90 text-red-500'
              : 'bg-black/25 text-white hover:bg-black/40',
          )}
          aria-label={favorite ? t('recipes.removeFavorite') : t('recipes.addFavorite')}
        >
          <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>

        {recipe.rating && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <Star size={11} fill="currentColor" />
            {recipe.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[0.95rem] font-semibold leading-snug tracking-tight text-ink">
          {recipe.title[locale]}
        </h3>
        <p className="muted mt-1.5 line-clamp-2 flex-1 text-[0.8rem]">
          {recipe.description[locale]}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {totalTime(recipe)} {t('common.minutes')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame size={12} />
            {recipe.nutrition.calories} {t('common.kcal')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={12} />
            {recipe.servings}
          </span>
          <span className="ml-auto rounded-full bg-brand-500/[0.12] px-2 py-0.5 text-brand-700 dark:text-brand-300">
            {t(`recipes.${recipe.difficulty}`)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export default RecipeCard;
