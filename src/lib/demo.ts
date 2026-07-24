import type {
  AgentId,
  Locale,
  MealPlan,
  PhotoAnalysis,
  PlanDay,
  PlanMeal,
  PlannerInput,
  Recipe,
} from '@/lib/types';
import { RECIPES } from '@/data/recipes';
import { macroTargets, sumNutrition, targetCalories, waterMl } from '@/lib/nutrition';

/**
 * Demo content used when no AI key is configured — and as a fallback if a
 * provider call fails. Everything here is deterministic and offline, so every
 * button in the product does something real even with zero configuration.
 */

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/* -------------------------------------------------------------------------- */
/* Chat                                                                        */
/* -------------------------------------------------------------------------- */

const CHEF_DEMO: Record<Locale, string> = {
  ro: `## Descriere
Omletă cremoasă cu avocado și roșii, gata în 12 minute. Este o variantă echilibrată de mic dejun sau cină rapidă.

## Ingrediente
- 3 ouă
- 1/2 avocado copt
- 1 roșie medie
- 1 linguriță ulei de măsline
- sare, piper, câteva frunze de busuioc

## Preparare
1. Bate ouăle cu un praf de sare, 20 de secunde, până se omogenizează.
2. Încinge tigaia la foc mediu-mic cu uleiul.
3. Toarnă ouăle și amestecă lent cu spatula, aducând marginile spre centru.
4. Când mai sunt ușor umede, oprește focul — se vor găti din căldura reziduală.
5. Servește cu avocado feliat, roșia în cubulețe și busuioc proaspăt.

## Valori nutritive
Aproximativ 410 kcal, 24 g proteine, 9 g carbohidrați, 31 g grăsimi (estimare).

## Sfaturi
- Focul mic este diferența dintre o omletă cremoasă și una uscată.
- Sarea se pune la început: ajută proteinele să rețină apa.

## Alternative
- Fără ouă: tofu ferm sfărâmat cu turmeric.
- Fără avocado: hummus sau brânză proaspătă.

## Alergeni
Ouă. Fără gluten și fără lactoză în varianta de mai sus.`,
  ru: `## Описание
Кремовый омлет с авокадо и помидорами, готов за 12 минут. Сбалансированный завтрак или быстрый ужин.

## Ингредиенты
- 3 яйца
- 1/2 спелого авокадо
- 1 средний помидор
- 1 ч. л. оливкового масла
- соль, перец, несколько листьев базилика

## Приготовление
1. Взбейте яйца со щепоткой соли 20 секунд до однородности.
2. Разогрейте сковороду на среднем-слабом огне с маслом.
3. Влейте яйца и медленно перемешивайте лопаткой, сдвигая края к центру.
4. Когда масса ещё слегка влажная, выключите огонь — она дойдёт сама.
5. Подавайте с ломтиками авокадо, кубиками помидора и свежим базиликом.

## Пищевая ценность
Примерно 410 ккал, 24 г белка, 9 г углеводов, 31 г жиров (оценка).

## Советы
- Слабый огонь — главное отличие кремового омлета от сухого.
- Соль в начале помогает белкам удержать влагу.

## Альтернативы
- Без яиц: раскрошенный плотный тофу с куркумой.
- Без авокадо: хумус или мягкий творожный сыр.

## Аллергены
Яйца. В этом варианте нет глютена и лактозы.`,
  en: `## Description
A creamy omelette with avocado and tomato, ready in 12 minutes. A balanced breakfast or fast dinner.

## Ingredients
- 3 eggs
- 1/2 ripe avocado
- 1 medium tomato
- 1 tsp olive oil
- salt, pepper, a few basil leaves

## Preparation
1. Beat the eggs with a pinch of salt for 20 seconds until uniform.
2. Heat the pan over medium-low with the oil.
3. Pour in the eggs and stir slowly, pulling the edges to the centre.
4. While still slightly wet, kill the heat — residual warmth finishes it.
5. Serve with sliced avocado, diced tomato and fresh basil.

## Nutrition
Roughly 410 kcal, 24 g protein, 9 g carbs, 31 g fat (estimate).

## Tips
- Low heat is the difference between creamy and rubbery.
- Salting at the start helps the proteins hold water.

## Alternatives
- Egg-free: crumbled firm tofu with turmeric.
- No avocado: hummus or fresh cheese.

## Allergens
Eggs. The version above is gluten-free and lactose-free.`,
};

const NUTRITION_DEMO: Record<Locale, string> = {
  ro: `## Obiectiv
Menținerea greutății, cu accent pe sațietate și proteine suficiente.

## Necesar estimativ
Aproximativ 2100 kcal, 130 g proteine, 230 g carbohidrați, 70 g grăsimi (estimare orientativă).

## Plan zilnic
- **Mic dejun:** ouă cu avocado și pâine integrală — ~420 kcal
- **Gustare:** iaurt grecesc cu fructe — ~180 kcal
- **Prânz:** orez cu pui și legume la tigaie — ~620 kcal
- **Gustare:** un pumn de nuci și o banană — ~280 kcal
- **Cină:** somon la cuptor cu salată verde — ~520 kcal

## Alternative
- Somonul poate fi înlocuit cu păstrăv, tofu sau piept de curcan.
- Orezul poate fi înlocuit cu quinoa sau cartof dulce.

## Lista de cumpărături
Ouă, avocado, pâine integrală, iaurt grecesc, fructe, orez, piept de pui, legume, nuci, banane, somon, salată verde.

## Sfaturi
- Bea aproximativ 2,2 litri de apă pe zi.
- Planul este orientativ; pentru obiective medicale, consultă un specialist.`,
  ru: `## Цель
Поддержание веса с акцентом на сытость и достаточное количество белка.

## Ориентировочная потребность
Примерно 2100 ккал, 130 г белка, 230 г углеводов, 70 г жиров (оценка).

## План на день
- **Завтрак:** яйца с авокадо и цельнозерновым хлебом — ~420 ккал
- **Перекус:** греческий йогурт с фруктами — ~180 ккал
- **Обед:** рис с курицей и овощами — ~620 ккал
- **Перекус:** горсть орехов и банан — ~280 ккал
- **Ужин:** запечённый лосось с зелёным салатом — ~520 ккал

## Альтернативы
- Лосось можно заменить форелью, тофу или индейкой.
- Рис — киноа или бататом.

## Список покупок
Яйца, авокадо, цельнозерновой хлеб, греческий йогурт, фрукты, рис, куриная грудка, овощи, орехи, бананы, лосось, салат.

## Советы
- Пейте около 2,2 л воды в день.
- План ориентировочный; при медицинских целях обратитесь к специалисту.`,
  en: `## Goal
Maintain weight, with a focus on satiety and sufficient protein.

## Estimated needs
Around 2100 kcal, 130 g protein, 230 g carbs, 70 g fat (indicative estimate).

## Daily plan
- **Breakfast:** eggs with avocado and wholegrain bread — ~420 kcal
- **Snack:** Greek yoghurt with fruit — ~180 kcal
- **Lunch:** rice with chicken and pan-fried vegetables — ~620 kcal
- **Snack:** a handful of nuts and a banana — ~280 kcal
- **Dinner:** baked salmon with green salad — ~520 kcal

## Alternatives
- Salmon can be swapped for trout, tofu or turkey breast.
- Rice can be swapped for quinoa or sweet potato.

## Shopping list
Eggs, avocado, wholegrain bread, Greek yoghurt, fruit, rice, chicken breast, vegetables, nuts, bananas, salmon, salad leaves.

## Tips
- Drink about 2.2 litres of water a day.
- The plan is indicative; for medical goals, consult a professional.`,
};

const CUISINE_DEMO: Record<Locale, string> = {
  ro: `## Meniu
- **Gustare:** salată Olivier și castraveți murați
- **Fel principal:** pelmeni cu smântână și mărar
- **Supă:** borș cu sfeclă și pâine neagră
- **Desert:** medovik (tort cu miere)
- **Băutură:** compot de fructe

## Despre preparate
- **Pelmeni** vin din Siberia; erau congelați natural, afară, și fierți iarna.
- **Borșul** este împărțit de mai multe bucătării est-europene, cu variații de la o regiune la alta — nu aparține unei singure țări.
- **Salata Olivier** a fost creată în Moscova, în secolul XIX, într-o variantă mult mai scumpă decât cea de azi.
- **Medovik** este un tort cu foi subțiri de miere și cremă de smântână.

## Ordinea servirii
Gustările reci se pun pe masă de la început, apoi vine supa, urmată de felul principal și desertul.

## Lista de cumpărături
Făină, carne tocată, cartofi, morcovi, sfeclă, varză, castraveți murați, mazăre, ouă, smântână, miere, fructe pentru compot.

## Sfaturi
- Pelmenii se congelează crud și se fierb direct din congelator.
- Borșul este mai bun a doua zi.`,
  ru: `## Меню
- **Закуска:** салат Оливье и солёные огурцы
- **Горячее:** пельмени со сметаной и укропом
- **Суп:** борщ со свёклой и чёрным хлебом
- **Десерт:** медовик
- **Напиток:** компот

## О блюдах
- **Пельмени** пришли из Сибири; их замораживали на улице и варили зимой.
- **Борщ** распространён в нескольких восточноевропейских кухнях с региональными вариациями — он не принадлежит одной стране.
- **Оливье** создан в Москве в XIX веке в куда более дорогом варианте, чем сегодняшний.
- **Медовик** — торт из тонких медовых коржей со сметанным кремом.

## Порядок подачи
Холодные закуски ставят на стол сразу, затем суп, горячее и десерт.

## Список покупок
Мука, фарш, картофель, морковь, свёкла, капуста, солёные огурцы, горошек, яйца, сметана, мёд, фрукты для компота.

## Советы
- Пельмени замораживают сырыми и варят прямо из морозилки.
- Борщ вкуснее на следующий день.`,
  en: `## Menu
- **Starter:** Olivier salad and pickled cucumbers
- **Main:** pelmeni with sour cream and dill
- **Soup:** beetroot borscht with rye bread
- **Dessert:** medovik (honey cake)
- **Drink:** fruit compote

## About the dishes
- **Pelmeni** come from Siberia, where they were frozen outdoors and boiled through the winter.
- **Borscht** is shared across several Eastern European cuisines, with regional variations — it does not belong to a single country.
- **Olivier salad** was created in 19th-century Moscow, in a far more expensive form than today's.
- **Medovik** is a layer cake of thin honey sheets with sour-cream frosting.

## Serving order
Cold starters go on the table first, then the soup, the main course and finally dessert.

## Shopping list
Flour, minced meat, potatoes, carrots, beetroot, cabbage, pickles, peas, eggs, sour cream, honey, fruit for the compote.

## Tips
- Freeze pelmeni raw and boil them straight from frozen.
- Borscht tastes better the next day.`,
};

const DEMO_BY_AGENT: Record<AgentId, Record<Locale, string>> = {
  chef: CHEF_DEMO,
  nutrition: NUTRITION_DEMO,
  cuisine: CUISINE_DEMO,
};

const DEMO_PREFIX: Record<Locale, string> = {
  ro: '> **Mod demonstrativ** — cheia API nu este configurată, așa că acesta este un răspuns pregătit în avans.\n\n',
  ru: '> **Демо-режим** — API-ключ не настроен, поэтому это заранее подготовленный ответ.\n\n',
  en: '> **Demo mode** — no API key is configured, so this is a pre-written answer.\n\n',
};

export function demoChatReply(agent: AgentId, locale: Locale): string {
  return DEMO_PREFIX[locale] + DEMO_BY_AGENT[agent][locale];
}

/* -------------------------------------------------------------------------- */
/* Photo analysis                                                              */
/* -------------------------------------------------------------------------- */

export function demoAnalysis(locale: Locale): PhotoAnalysis {
  const content = {
    ro: {
      dish: 'Bol cu orez, pui la grătar și legume',
      portion: 'Aproximativ 380–420 g',
      ingredients: ['Orez alb', 'Piept de pui', 'Broccoli', 'Morcov', 'Ulei vegetal', 'Sos de soia'],
      benefits: [
        'Sursă bună de proteine slabe',
        'Legumele adaugă fibre și micronutrienți',
        'Porție echilibrată ca raport proteine–carbohidrați',
      ],
      watchOuts: [
        'Sosul de soia poate adăuga multă sare',
        'Orezul alb are indice glicemic ridicat',
      ],
      frequency: 'Poate fi consumat de 3–4 ori pe săptămână.',
      problematic: ['Sos de soia (gluten, sare)', 'Ulei în cantitate necunoscută'],
      healthier: [
        'Înlocuiește orezul alb cu orez brun sau quinoa',
        'Folosește sos de soia cu conținut redus de sodiu',
        'Crește porția de legume cu 50%',
      ],
      summary:
        'Un preparat echilibrat, potrivit pentru prânz sau după antrenament. Principalul aspect de urmărit este sarea din sos.',
    },
    ru: {
      dish: 'Миска с рисом, курицей гриль и овощами',
      portion: 'Примерно 380–420 г',
      ingredients: ['Белый рис', 'Куриная грудка', 'Брокколи', 'Морковь', 'Растительное масло', 'Соевый соус'],
      benefits: [
        'Хороший источник постного белка',
        'Овощи добавляют клетчатку и микроэлементы',
        'Сбалансированное соотношение белков и углеводов',
      ],
      watchOuts: ['Соевый соус может добавить много соли', 'У белого риса высокий гликемический индекс'],
      frequency: 'Подходит 3–4 раза в неделю.',
      problematic: ['Соевый соус (глютен, соль)', 'Масло в неизвестном количестве'],
      healthier: [
        'Замените белый рис бурым или киноа',
        'Используйте соевый соус с пониженным содержанием натрия',
        'Увеличьте порцию овощей на 50%',
      ],
      summary:
        'Сбалансированное блюдо для обеда или после тренировки. Главное — следить за солью из соуса.',
    },
    en: {
      dish: 'Bowl with rice, grilled chicken and vegetables',
      portion: 'Approximately 380–420 g',
      ingredients: ['White rice', 'Chicken breast', 'Broccoli', 'Carrot', 'Vegetable oil', 'Soy sauce'],
      benefits: [
        'A good source of lean protein',
        'The vegetables add fibre and micronutrients',
        'Balanced protein-to-carb ratio for the portion',
      ],
      watchOuts: ['Soy sauce can add a lot of salt', 'White rice has a high glycaemic index'],
      frequency: 'Suitable 3–4 times a week.',
      problematic: ['Soy sauce (gluten, salt)', 'Oil in an unknown amount'],
      healthier: [
        'Swap white rice for brown rice or quinoa',
        'Use a reduced-sodium soy sauce',
        'Increase the vegetable portion by 50%',
      ],
      summary:
        'A balanced dish, suitable for lunch or after training. The main thing to watch is the salt from the sauce.',
    },
  }[locale];

  return {
    id: uid('an'),
    createdAt: Date.now(),
    dish: content.dish,
    kind: 'food',
    confidence: 0.72,
    portion: content.portion,
    ingredients: content.ingredients,
    nutrition: { calories: 540, protein: 38, carbs: 58, fat: 16, sugar: 6, salt: 2.3, fiber: 6 },
    healthScore: 74,
    benefits: content.benefits,
    watchOuts: content.watchOuts,
    frequency: content.frequency,
    problematic: content.problematic,
    healthierSuggestions: content.healthier,
    summary: content.summary,
    demo: true,
  };
}

/* -------------------------------------------------------------------------- */
/* Meal plan                                                                   */
/* -------------------------------------------------------------------------- */

const DAY_KEYS = [
  'planner.monday',
  'planner.tuesday',
  'planner.wednesday',
  'planner.thursday',
  'planner.friday',
  'planner.saturday',
  'planner.sunday',
];

/**
 * Builds a plan locally: picks recipes that satisfy the user's restrictions,
 * scales portions to the calorie target and fills the gaps with simple,
 * hand-written meals. Used in demo mode and whenever the model call fails.
 */
export function buildLocalPlan(input: PlannerInput, locale: Locale, t: (k: string) => string): MealPlan {
  const calories = targetCalories(input);
  const macros = macroTargets(calories, input.goal);
  const water = waterMl(input);

  const forbidden = [...input.allergies, ...input.intolerances, ...input.excluded, ...input.disliked]
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean);

  const usable = RECIPES.filter((r) => {
    if (r.categories.includes('cocktails')) return false;
    if (input.diets.length && !input.diets.every((d) => r.tags.includes(d))) return false;
    if (r.prepMinutes + r.cookMinutes > Math.max(input.cookingMinutes, 20) * 2) return false;
    const text = [
      r.title[locale],
      ...r.ingredients.map((i) => i.name[locale]),
      ...r.allergens,
    ]
      .join(' ')
      .toLowerCase();
    return !forbidden.some((f) => text.includes(f));
  });

  const bySlot = (slot: 'breakfast' | 'lunch' | 'dinner' | 'snack') =>
    usable.filter((r) => r.mealSlots.includes(slot));

  const slots: PlanMeal['slot'][] =
    input.mealsPerDay >= 5
      ? ['breakfast', 'snack', 'lunch', 'snack2', 'dinner']
      : input.mealsPerDay === 4
        ? ['breakfast', 'lunch', 'snack', 'dinner']
        : input.mealsPerDay === 3
          ? ['breakfast', 'lunch', 'dinner']
          : ['breakfast', 'dinner'];

  // Energy split across the chosen slots.
  const WEIGHTS: Record<PlanMeal['slot'], number> = {
    breakfast: 0.25,
    snack: 0.1,
    lunch: 0.35,
    snack2: 0.1,
    dinner: 0.3,
  };
  const weightSum = slots.reduce((s, x) => s + WEIGHTS[x], 0);

  const days: PlanDay[] = [];
  for (let d = 0; d < Math.max(1, Math.min(input.days, 7)); d += 1) {
    const meals: PlanMeal[] = slots.map((slot, i) => {
      const poolKey = slot === 'snack2' ? 'snack' : slot;
      const pool = bySlot(poolKey as 'breakfast' | 'lunch' | 'dinner' | 'snack');
      const recipe: Recipe | undefined = pool.length
        ? pool[(d * slots.length + i) % pool.length]
        : usable[(d + i) % Math.max(usable.length, 1)];
      const share = (WEIGHTS[slot] / weightSum) * calories;
      const factor = recipe ? Math.max(0.5, Math.min(2, share / recipe.nutrition.calories)) : 1;

      const alternatives = pool
        .filter((r) => r.id !== recipe?.id)
        .slice(0, 3)
        .map((r) => r.title[locale]);

      return {
        id: uid('meal'),
        slot,
        title: recipe ? recipe.title[locale] : t(`planner.${slot === 'snack2' ? 'snack' : slot}`),
        description: recipe ? recipe.description[locale] : '',
        quantity: recipe
          ? `${Math.round(factor * 10) / 10} × ${t('common.portion')}`
          : '1 × ' + t('common.portion'),
        nutrition: recipe
          ? {
              calories: Math.round(recipe.nutrition.calories * factor),
              protein: Math.round(recipe.nutrition.protein * factor),
              carbs: Math.round(recipe.nutrition.carbs * factor),
              fat: Math.round(recipe.nutrition.fat * factor),
            }
          : { calories: Math.round(share), protein: 0, carbs: 0, fat: 0 },
        alternatives,
        recipeId: recipe?.id,
      };
    });

    days.push({
      id: uid('day'),
      dayIndex: d,
      label: t(DAY_KEYS[d % 7]),
      meals,
      totals: sumNutrition(meals.map((m) => m.nutrition)),
      waterMl: water,
    });
  }

  const notes: Record<Locale, string[]> = {
    ro: [
      'Împarte apa uniform pe parcursul zilei.',
      'Poți înlocui orice masă folosind butonul „Înlocuiește”.',
      'Planul este orientativ și nu înlocuiește sfatul unui specialist.',
    ],
    ru: [
      'Распределяйте воду равномерно в течение дня.',
      'Любой приём пищи можно заменить кнопкой «Заменить».',
      'План ориентировочный и не заменяет консультацию специалиста.',
    ],
    en: [
      'Spread your water intake evenly through the day.',
      'You can swap any meal with the "Replace" button.',
      'The plan is indicative and does not replace professional advice.',
    ],
  };

  return {
    id: uid('plan'),
    createdAt: Date.now(),
    title: `${t('planner.planTitle')} · ${t(`planner.goal${input.goal.charAt(0).toUpperCase()}${input.goal.slice(1)}`)}`,
    goal: input.goal,
    targetCalories: calories,
    macroTargets: macros,
    days,
    notes: notes[locale],
    input,
    demo: true,
  };
}
