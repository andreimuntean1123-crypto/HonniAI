'use client';

import { clsx } from 'clsx';
import type { DietTag, Difficulty, MealSlot, RecipeFilters } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { Modal } from '@/components/ui/Modal';
import { TagInput } from '@/components/ui';
import { CUISINES } from '@/data/cuisines';
import { EMPTY_FILTERS } from '@/data/recipes';

const DIETS: DietTag[] = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'lactose-free',
  'high-protein',
  'low-calorie',
  'quick',
  'halal',
];

const TIMES = [15, 30, 60];
const CALORIES = [300, 500, 800];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const BUDGETS = ['low', 'medium', 'high'] as const;
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function FiltersPanel({
  open,
  onClose,
  filters,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  filters: RecipeFilters;
  onChange: (next: RecipeFilters) => void;
}) {
  const { t, locale } = useI18n();
  const set = (patch: Partial<RecipeFilters>) => onChange({ ...filters, ...patch });

  const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <section className="border-t border-hairline pt-4 first:border-0 first:pt-0">
      <p className="label !mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  );

  const Chip = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button onClick={onClick} className={clsx('chip', active && 'chip-active')}>
      {children}
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('common.filters')}
      variant="sheet"
      className="sm:max-w-lg"
      footer={
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...EMPTY_FILTERS, query: filters.query })}
            className="btn-secondary btn-sm flex-1 justify-center"
          >
            {t('common.reset')}
          </button>
          <button onClick={onClose} className="btn-primary btn-sm flex-[2] justify-center">
            {t('common.apply')}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <Group label={t('filters.time')}>
          <Chip
            active={!filters.maxTotalMinutes}
            onClick={() => set({ maxTotalMinutes: undefined })}
          >
            {t('filters.anyTime')}
          </Chip>
          {TIMES.map((minutes) => (
            <Chip
              key={minutes}
              active={filters.maxTotalMinutes === minutes}
              onClick={() =>
                set({
                  maxTotalMinutes: filters.maxTotalMinutes === minutes ? undefined : minutes,
                })
              }
            >
              {t(`filters.under${minutes}`)}
            </Chip>
          ))}
        </Group>

        <Group label={t('filters.calories')}>
          <Chip active={!filters.maxCalories} onClick={() => set({ maxCalories: undefined })}>
            {t('common.all')}
          </Chip>
          {CALORIES.map((kcal) => (
            <Chip
              key={kcal}
              active={filters.maxCalories === kcal}
              onClick={() =>
                set({ maxCalories: filters.maxCalories === kcal ? undefined : kcal })
              }
            >
              ≤ {kcal} {t('common.kcal')}
            </Chip>
          ))}
        </Group>

        <Group label={t('filters.difficulty')}>
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              active={filters.difficulty === d}
              onClick={() => set({ difficulty: filters.difficulty === d ? undefined : d })}
            >
              {t(`recipes.${d}`)}
            </Chip>
          ))}
        </Group>

        <Group label={t('filters.diet')}>
          {DIETS.map((diet) => (
            <Chip
              key={diet}
              active={filters.diets.includes(diet)}
              onClick={() =>
                set({
                  diets: filters.diets.includes(diet)
                    ? filters.diets.filter((d) => d !== diet)
                    : [...filters.diets, diet],
                })
              }
            >
              {t(`diets.${diet}`)}
            </Chip>
          ))}
        </Group>

        <Group label={t('filters.budget')}>
          {BUDGETS.map((b) => (
            <Chip
              key={b}
              active={filters.budget === b}
              onClick={() => set({ budget: filters.budget === b ? undefined : b })}
            >
              {t(`filters.budget${b.charAt(0).toUpperCase()}${b.slice(1)}`)}
            </Chip>
          ))}
        </Group>

        <Group label={t('filters.mealSlot')}>
          {SLOTS.map((slot) => (
            <Chip
              key={slot}
              active={filters.mealSlot === slot}
              onClick={() => set({ mealSlot: filters.mealSlot === slot ? undefined : slot })}
            >
              {t(`filters.${slot}`)}
            </Chip>
          ))}
        </Group>

        <Group label={t('filters.cuisine')}>
          <Chip active={!filters.cuisine} onClick={() => set({ cuisine: undefined })}>
            {t('common.all')}
          </Chip>
          {CUISINES.map((c) => (
            <Chip
              key={c.id}
              active={filters.cuisine === c.id}
              onClick={() => set({ cuisine: filters.cuisine === c.id ? undefined : c.id })}
            >
              {c.flag} {c.name[locale]}
            </Chip>
          ))}
        </Group>

        <section className="border-t border-hairline pt-4">
          <p className="label !mb-2.5">{t('filters.pantry')}</p>
          <TagInput
            value={filters.pantry}
            onChange={(pantry) => set({ pantry })}
            placeholder={t('filters.pantryPlaceholder')}
          />
        </section>
      </div>
    </Modal>
  );
}

export default FiltersPanel;
