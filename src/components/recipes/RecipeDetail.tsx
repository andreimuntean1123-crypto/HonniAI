'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CalendarPlus,
  Clock,
  Flame,
  Heart,
  Leaf,
  Minus,
  Plus,
  ShoppingBasket,
  Sparkles,
  Timer,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Recipe } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useChatDock } from '@/components/chat/ChatDock';
import { Modal } from '@/components/ui/Modal';
import { FoodArt } from '@/components/ui/FoodArt';
import { MacroBar, Stat } from '@/components/ui';
import { totalTime } from '@/data/recipes';
import { addRecipeToPlan } from '@/lib/planUtils';

export function RecipeDetail({
  recipe,
  open,
  onClose,
}: {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const { isFavorite, toggleFavorite, addIngredients, data, savePlan } = useData();
  const { toast } = useToast();
  const { open: openChat } = useChatDock();
  const [servings, setServings] = useState<number | null>(null);

  if (!recipe) return null;

  const currentServings = servings ?? recipe.servings;
  const scale = currentServings / recipe.servings;
  const favorite = isFavorite(recipe.id);

  const formatAmount = (amount: number | null) => {
    if (amount === null) return '';
    const scaled = amount * scale;
    return scaled >= 10 ? String(Math.round(scaled)) : String(Math.round(scaled * 100) / 100);
  };

  const nutrition = recipe.nutrition; // always per serving, so scaling does not change it

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="sheet"
      className="sm:max-w-3xl"
      footer={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const added = toggleFavorite(recipe);
              toast(added ? t('toast.addedFavorite') : t('toast.removedFavorite'));
            }}
            className={clsx('btn-secondary btn-sm', favorite && 'text-red-500')}
          >
            <Heart size={14} fill={favorite ? 'currentColor' : 'none'} />
            {favorite ? t('recipes.removeFavorite') : t('recipes.addFavorite')}
          </button>

          <button
            onClick={() => {
              const plan = addRecipeToPlan(data.plans, recipe, locale, t, scale);
              savePlan(plan);
              toast(t('toast.addedToPlan'));
            }}
            className="btn-secondary btn-sm"
          >
            <CalendarPlus size={14} />
            {t('recipes.addToPlan')}
          </button>

          <button
            onClick={() => {
              addIngredients(recipe.ingredients, locale, recipe.title[locale], scale);
              toast(t('toast.addedToList'));
            }}
            className="btn-secondary btn-sm"
          >
            <ShoppingBasket size={14} />
            {t('recipes.generateList')}
          </button>

          <button
            onClick={() =>
              openChat({
                agent: 'chef',
                prefill: '',
                autoSend:
                  locale === 'ro'
                    ? `Spune-mi mai multe despre rețeta „${recipe.title.ro}”. Cum o pot adapta pentru ${currentServings} porții?`
                    : locale === 'ru'
                      ? `Расскажи подробнее о рецепте «${recipe.title.ru}». Как адаптировать его на ${currentServings} порций?`
                      : `Tell me more about the "${recipe.title.en}" recipe. How do I adapt it for ${currentServings} servings?`,
                systemNote: `${recipe.title[locale]} — ${recipe.ingredients
                  .map((i) => i.name[locale])
                  .join(', ')}`,
              })
            }
            className="btn-primary btn-sm ml-auto"
          >
            <Sparkles size={14} />
            {t('recipes.askAgent')}
          </button>
        </div>
      }
    >
      {/* hero */}
      <div className="relative -mx-5 -mt-5 mb-5">
        <FoodArt
          seed={recipe.slug}
          emoji={recipe.emoji}
          image={recipe.image}
          size="lg"
          rounded="rounded-none"
          className="h-44 w-full sm:h-56"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {recipe.title[locale]}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-white/85">
            {recipe.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur-sm">
                {t(`diets.${tag}`)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="muted">{recipe.description[locale]}</p>

      {/* key numbers */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t('recipes.prep')} value={recipe.prepMinutes} suffix={t('common.minutes')} />
        <Stat label={t('recipes.cook')} value={recipe.cookMinutes} suffix={t('common.minutes')} />
        <Stat label={t('recipes.totalTime')} value={totalTime(recipe)} suffix={t('common.minutes')} />
        <Stat label={t('recipes.difficulty')} value={t(`recipes.${recipe.difficulty}`)} />
      </div>

      {/* servings scaler */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-hairline bg-surface-2/50 px-4 py-3">
        <span className="text-sm font-medium text-ink">{t('recipes.scaleServings')}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setServings(Math.max(1, currentServings - 1))}
            className="icon-btn h-8 w-8 border border-hairline"
            aria-label="-"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-display text-lg font-semibold text-ink">
            {currentServings}
          </span>
          <button
            onClick={() => setServings(Math.min(24, currentServings + 1))}
            className="icon-btn h-8 w-8 border border-hairline"
            aria-label="+"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* nutrition */}
      <section className="mt-6">
        <h3 className="section-title !text-lg">{t('recipes.nutritionFacts')}</h3>
        <p className="mb-3 text-xs text-ink-muted">{t('recipes.perServing')}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label={t('recipes.calories')} value={nutrition.calories} suffix={t('common.kcal')} accent />
          <Stat label={t('recipes.protein')} value={nutrition.protein} suffix="g" />
          <Stat label={t('recipes.carbs')} value={nutrition.carbs} suffix="g" />
          <Stat label={t('recipes.fat')} value={nutrition.fat} suffix="g" />
        </div>
        <div className="mt-3">
          <MacroBar
            protein={nutrition.protein}
            carbs={nutrition.carbs}
            fat={nutrition.fat}
            labels={[t('recipes.protein'), t('recipes.carbs'), t('recipes.fat')]}
          />
        </div>
        {(nutrition.sugar !== undefined || nutrition.fiber !== undefined) && (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-muted">
            {nutrition.sugar !== undefined && (
              <span className="badge">
                {t('recipes.sugar')}: {nutrition.sugar} g
              </span>
            )}
            {nutrition.fiber !== undefined && (
              <span className="badge">
                {t('recipes.fiber')}: {nutrition.fiber} g
              </span>
            )}
            {nutrition.salt !== undefined && (
              <span className="badge">
                {t('recipes.salt')}: {nutrition.salt} g
              </span>
            )}
          </div>
        )}
      </section>

      {/* ingredients */}
      <section className="mt-7">
        <h3 className="section-title !text-lg">{t('recipes.ingredients')}</h3>
        <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline">
          {recipe.ingredients.map((ing) => (
            <li
              key={ing.id}
              className="flex items-center justify-between gap-4 bg-surface-2/40 px-4 py-2.5 text-sm"
            >
              <span className="text-ink">
                {ing.name[locale]}
                {ing.optional && (
                  <span className="ml-1.5 text-xs text-ink-muted">({t('common.optional')})</span>
                )}
              </span>
              <span className="shrink-0 font-medium text-ink-soft">
                {formatAmount(ing.amount)} {ing.unit ? ing.unit[locale] : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* steps */}
      <section className="mt-7">
        <h3 className="section-title !text-lg">{t('recipes.steps')}</h3>
        <ol className="mt-3 space-y-3">
          {recipe.steps[locale].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-700 dark:text-brand-300">
                {i + 1}
              </span>
              <p className="muted text-[0.9rem] text-ink-soft">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* tips */}
      {recipe.tips[locale].length > 0 && (
        <section className="mt-7">
          <h3 className="section-title !text-lg">{t('recipes.tips')}</h3>
          <ul className="mt-3 space-y-2">
            {recipe.tips[locale].map((tip, i) => (
              <li
                key={i}
                className="flex gap-2.5 rounded-2xl border border-hairline bg-surface-2/40 px-4 py-3 text-sm text-ink-soft"
              >
                <Timer size={15} className="mt-0.5 shrink-0 text-brand-500" />
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* substitutions */}
      {recipe.substitutions.length > 0 && (
        <section className="mt-7">
          <h3 className="section-title !text-lg">{t('recipes.substitutions')}</h3>
          <ul className="mt-3 space-y-2">
            {recipe.substitutions.map((sub, i) => (
              <li key={i} className="rounded-2xl border border-hairline px-4 py-3 text-sm">
                <span className="font-medium text-ink">{sub.for[locale]}</span>
                <span className="mx-2 text-ink-muted">→</span>
                <span className="text-ink-soft">{sub.use[locale]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* healthier */}
      {recipe.healthierVariant[locale] && (
        <section className="mt-7">
          <h3 className="section-title !text-lg">{t('recipes.healthier')}</h3>
          <p className="mt-3 flex gap-2.5 rounded-2xl border border-brand-500/25 bg-brand-500/[0.07] px-4 py-3 text-sm text-ink-soft">
            <Leaf size={16} className="mt-0.5 shrink-0 text-brand-500" />
            {recipe.healthierVariant[locale]}
          </p>
        </section>
      )}

      {/* allergens */}
      <section className="mt-7">
        <h3 className="section-title !text-lg">{t('recipes.allergens')}</h3>
        {recipe.allergens.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.allergens.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/[0.12] px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300"
              >
                <AlertTriangle size={12} />
                {t(`allergens.${a}`)}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted mt-3 text-sm">{t('recipes.noAllergens')}</p>
        )}
      </section>

      <p className="mt-7 flex items-start gap-2 text-[11px] leading-relaxed text-ink-muted">
        <Flame size={12} className="mt-0.5 shrink-0" />
        {t('analyze.disclaimer')}
      </p>
      <div className="flex items-center gap-2 pt-1 text-[11px] text-ink-muted">
        <Clock size={11} />
        {t('recipes.totalTime')}: {totalTime(recipe)} {t('common.minutes')}
      </div>
    </Modal>
  );
}

export default RecipeDetail;
