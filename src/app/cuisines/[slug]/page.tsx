'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useData } from '@/components/providers/DataProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal } from '@/components/ui';
import { FoodArt } from '@/components/ui/FoodArt';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDetail } from '@/components/recipes/RecipeDetail';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CUISINES, getCuisine } from '@/data/cuisines';
import { RECIPES } from '@/data/recipes';

export default function CuisinePage() {
  const params = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const { markCuisineExplored } = useData();
  const [detail, setDetail] = useState<Recipe | null>(null);

  const cuisine = getCuisine(params.slug);

  useEffect(() => {
    if (cuisine) markCuisineExplored(cuisine.id);
  }, [cuisine, markCuisineExplored]);

  const recipes = useMemo(
    () => RECIPES.filter((r) => r.cuisine === params.slug),
    [params.slug],
  );

  if (!cuisine) return notFound();

  const menuPrompt =
    locale === 'ro'
      ? `Creează-mi un meniu autentic ${cuisine.name.ro.toLowerCase()} pentru astăzi, pentru 4 persoane.`
      : locale === 'ru'
        ? `Составь аутентичное меню (${cuisine.name.ru}) на сегодня для 4 человек.`
        : `Create an authentic ${cuisine.name.en} menu for today, for 4 people.`;

  return (
    <div className="container-page pb-16">
      <PageHeader
        title={`${cuisine.flag} ${cuisine.name[locale]}`}
        subtitle={cuisine.description[locale]}
        action={
          <Link href="/cuisines" className="btn-ghost btn-sm">
            <ArrowLeft size={14} />
            {t('common.back')}
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Reveal>
            <div className="card overflow-hidden">
              <FoodArt
                seed={cuisine.id}
                emoji={cuisine.emoji}
                gradient={cuisine.gradient}
                size="lg"
                rounded="rounded-none"
                className="h-40 w-full sm:h-52"
              />
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <div>
                  <p className="label">{t('cuisines.staples')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cuisine.staples[locale].map((s) => (
                      <span key={s} className="chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label">{t('cuisines.signature')}</p>
                  <ul className="space-y-2">
                    {cuisine.signatureDishes.map((dish) => (
                      <li key={dish.name} className="text-sm">
                        <span className="font-medium text-ink">{dish.name}</span>
                        <span className="muted block text-[0.8rem]">{dish.note[locale]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>

          {recipes.length > 0 && (
            <section>
              <h2 className="section-title !text-xl">{t('nav.recipes')}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {recipes.map((recipe, i) => (
                  <RecipeCard key={recipe.id} recipe={recipe} index={i} onOpen={setDetail} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="section-title !text-xl">{t('cuisines.title')}</h2>
            <div className="no-scrollbar scroll-row mt-4 flex gap-2 overflow-x-auto pb-2">
              {CUISINES.filter((c) => c.id !== cuisine.id).map((c) => (
                <Link
                  key={c.id}
                  href={`/cuisines/${c.id}`}
                  className="chip shrink-0 whitespace-nowrap"
                >
                  {c.flag} {c.name[locale]}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:h-[calc(100dvh-var(--header-h)-3rem)]">
          <div className="card flex h-[34rem] flex-col overflow-hidden p-0 lg:h-full">
            <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5 text-xs text-ink-muted">
              <Sparkles size={13} className="text-brand-500" />
              {t('cuisines.buildMenu')}
            </div>
            <div className="min-h-0 flex-1">
              <ChatPanel
                agent="cuisine"
                compact
                showHistory={false}
                prefill={menuPrompt}
                systemNote={`Cuisine: ${cuisine.name.en}. Signature dishes: ${cuisine.signatureDishes
                  .map((d) => d.name)
                  .join(', ')}.`}
                suggestions={[
                  menuPrompt,
                  locale === 'ro'
                    ? 'Explică-mi originea preparatelor.'
                    : locale === 'ru'
                      ? 'Расскажи о происхождении блюд.'
                      : 'Explain the origin of these dishes.',
                  locale === 'ro'
                    ? 'Vreau un meniu fără carne.'
                    : locale === 'ru'
                      ? 'Хочу меню без мяса.'
                      : 'I want a meat-free menu.',
                ]}
              />
            </div>
          </div>
        </aside>
      </div>

      <RecipeDetail recipe={detail} open={Boolean(detail)} onClose={() => setDetail(null)} />
    </div>
  );
}
