'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Minus,
  Plus,
  Printer,
  Share2,
  ShoppingBasket,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ShoppingCategory, ShoppingItem } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui';

const CATEGORY_ORDER: ShoppingCategory[] = [
  'produce',
  'meat-fish',
  'dairy',
  'grains',
  'spices',
  'drinks',
  'frozen',
  'other',
];

const CATEGORY_EMOJI: Record<ShoppingCategory, string> = {
  produce: '🥬',
  'meat-fish': '🐟',
  dairy: '🧀',
  grains: '🌾',
  spices: '🧂',
  drinks: '🧃',
  frozen: '🧊',
  other: '🛒',
};

export default function ShoppingListPage() {
  const { t } = useI18n();
  const {
    data,
    addShoppingItems,
    toggleShoppingItem,
    updateShoppingItem,
    removeShoppingItem,
    clearShopping,
  } = useData();
  const { toast } = useToast();
  const [draft, setDraft] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<ShoppingCategory, ShoppingItem[]>();
    for (const item of data.shoppingList) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: (map.get(c) ?? []).sort((a, b) => Number(a.checked) - Number(b.checked)),
    }));
  }, [data.shoppingList]);

  const done = data.shoppingList.filter((i) => i.checked).length;
  const total = data.shoppingList.length;

  const listAsText = () =>
    grouped
      .map(
        ({ category, items }) =>
          `${t(`shopping.categories.${category}`)}\n` +
          items
            .map(
              (i) =>
                `${i.checked ? '[x]' : '[ ]'} ${i.name}${
                  i.amount !== null ? ` — ${i.amount}${i.unit ? ` ${i.unit}` : ''}` : ''
                }`,
            )
            .join('\n'),
      )
      .join('\n\n');

  const share = async () => {
    const text = `${t('shopping.title')}\n\n${listAsText()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t('shopping.title'), text });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    await navigator.clipboard?.writeText(text);
    toast(t('toast.shareUnsupported'));
  };

  const print = () => {
    const win = window.open('', '_blank');
    if (!win) {
      void navigator.clipboard?.writeText(listAsText());
      toast(t('toast.copiedLink'));
      return;
    }
    win.document.write(
      `<pre style="font:14px/1.7 ui-sans-serif,system-ui;padding:32px;white-space:pre-wrap">${listAsText()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</pre>`,
    );
    win.document.title = t('shopping.title');
    win.document.close();
    win.print();
  };

  return (
    <div className="container-page pb-16">
      <PageHeader
        title={t('shopping.title')}
        subtitle={t('shopping.subtitle')}
        action={
          total > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button onClick={share} className="btn-secondary btn-sm">
                <Share2 size={14} />
                {t('common.share')}
              </button>
              <button onClick={print} className="btn-secondary btn-sm">
                <Printer size={14} />
                {t('common.print')}
              </button>
            </div>
          ) : undefined
        }
      />

      {/* add form */}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = draft.trim();
          if (!value) return;
          // "2 kg cartofi" → amount 2, unit kg, name cartofi
          const match = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Zа-яА-ЯăâîșțĂÂÎȘȚ.]*)\s+(.*)$/.exec(value);
          const added = addShoppingItems([
            match
              ? {
                  name: match[3],
                  amount: Number(match[1].replace(',', '.')),
                  unit: match[2] || null,
                  category: 'other',
                  source: 'manual',
                }
              : { name: value, amount: null, unit: null, category: 'other', source: 'manual' },
          ]);
          setDraft('');
          toast(added ? t('toast.addedToList') : t('shopping.merged'));
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('shopping.addPlaceholder')}
          className="input py-3"
        />
        <button type="submit" className="btn-primary shrink-0 px-5">
          <Plus size={16} />
          <span className="hidden sm:inline">{t('shopping.addButton')}</span>
        </button>
      </form>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink/[0.08] dark:bg-white/10">
              <motion.div
                className="h-full rounded-full bg-brand-500"
                animate={{ width: `${total ? (done / total) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 240, damping: 30 }}
              />
            </div>
            <span className="text-xs text-ink-muted">
              {t('shopping.checkedCount', { done, total })}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => clearShopping(true)} className="btn-ghost btn-sm">
              <Check size={13} />
              {t('shopping.clearChecked')}
            </button>
            <button
              onClick={() => {
                clearShopping(false);
                toast(t('toast.itemDeleted'));
              }}
              className="btn-ghost btn-sm text-red-500"
            >
              <Trash2 size={13} />
              {t('shopping.clearAll')}
            </button>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<ShoppingBasket size={26} />}
            title={t('common.empty')}
            text={t('shopping.empty')}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <AnimatePresence initial={false}>
            {grouped.map(({ category, items }) => (
              <motion.section
                key={category}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card overflow-hidden"
              >
                <h2 className="flex items-center gap-2 border-b border-hairline px-5 py-3 font-display text-sm font-semibold text-ink">
                  <span>{CATEGORY_EMOJI[category]}</span>
                  {t(`shopping.categories.${category}`)}
                  <span className="ml-auto text-xs font-normal text-ink-muted">
                    {items.length}
                  </span>
                </h2>

                <ul className="divide-y divide-hairline">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={clsx(
                        'flex items-center gap-3 px-5 py-3 transition-opacity',
                        item.checked && 'opacity-50',
                      )}
                    >
                      <button
                        onClick={() => toggleShoppingItem(item.id)}
                        className={clsx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                          item.checked
                            ? 'border-brand-500 bg-brand-500 text-black'
                            : 'border-hairline hover:border-brand-500',
                        )}
                        aria-label={item.name}
                      >
                        {item.checked && <Check size={13} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={clsx(
                            'truncate text-sm text-ink',
                            item.checked && 'line-through',
                          )}
                        >
                          {item.name}
                        </p>
                        {item.source && item.source !== 'manual' && (
                          <p className="truncate text-[11px] text-ink-muted">{item.source}</p>
                        )}
                      </div>

                      {item.amount !== null && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() =>
                              updateShoppingItem(item.id, {
                                amount: Math.max(0, Math.round(((item.amount ?? 0) - 1) * 100) / 100),
                              })
                            }
                            className="icon-btn h-7 w-7"
                            aria-label="-"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="min-w-[3.5rem] text-center text-xs font-medium text-ink-soft">
                            {item.amount} {item.unit ?? ''}
                          </span>
                          <button
                            onClick={() =>
                              updateShoppingItem(item.id, {
                                amount: Math.round(((item.amount ?? 0) + 1) * 100) / 100,
                              })
                            }
                            className="icon-btn h-7 w-7"
                            aria-label="+"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => removeShoppingItem(item.id)}
                        className="icon-btn h-7 w-7 shrink-0"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
