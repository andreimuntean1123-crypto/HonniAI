'use client';

import Link from 'next/link';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';
import { useData } from '@/components/providers/DataProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal } from '@/components/ui';
import { FoodArt } from '@/components/ui/FoodArt';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CUISINES } from '@/data/cuisines';

export default function CuisinesPage() {
  const { t, locale } = useI18n();
  const { data } = useData();

  return (
    <div className="container-page pb-16">
      <PageHeader title={t('cuisines.title')} subtitle={t('cuisines.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CUISINES.map((cuisine, i) => {
            const explored = data.exploredCuisines.includes(cuisine.id);
            return (
              <Reveal key={cuisine.id} delay={Math.min(i * 0.03, 0.3)}>
                <Link
                  href={`/cuisines/${cuisine.id}`}
                  className="card card-hover group flex h-full flex-col overflow-hidden"
                >
                  <div className="relative">
                    <FoodArt
                      seed={cuisine.id}
                      emoji={cuisine.emoji}
                      gradient={cuisine.gradient}
                      rounded="rounded-none"
                      className="h-32 w-full transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2 py-1 text-lg backdrop-blur-md">
                      {cuisine.flag}
                    </span>
                    {explored && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-500/90 px-2 py-1 text-[10px] font-medium text-black">
                        <Check size={10} />
                        {t('cuisines.exploredBadge')}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-display text-[0.98rem] font-semibold tracking-tight text-ink">
                      {cuisine.name[locale]}
                    </h2>
                    <p className="muted mt-1.5 line-clamp-2 text-[0.82rem]">
                      {cuisine.description[locale]}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {cuisine.staples[locale].slice(0, 3).map((s) => (
                        <span key={s} className="badge text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-400">
                      {t('cuisines.explore')}
                      <ArrowRight size={13} />
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* world cuisine agent */}
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:h-[calc(100dvh-var(--header-h)-3rem)]">
          <div className="card flex h-[32rem] flex-col overflow-hidden p-0 lg:h-full">
            <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5 text-xs text-ink-muted">
              <Sparkles size={13} className="text-brand-500" />
              {t('cuisines.askAgent')}
            </div>
            <div className="min-h-0 flex-1">
              <ChatPanel agent="cuisine" compact showHistory={false} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
