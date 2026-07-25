/** Shared domain model for Honni AI. */

export type Locale = 'ro' | 'ru' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';

/** Every user-facing string in the data layer exists in all three locales. */
export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

/* -------------------------------------------------------------------------- */
/* Recipes                                                                     */
/* -------------------------------------------------------------------------- */

export type RecipeGroup = 'food' | 'drink';

export type FoodCategory =
  | 'appetizers'
  | 'soups'
  | 'mains'
  | 'salads'
  | 'desserts'
  | 'breakfast'
  | 'snacks'
  | 'vegetarian'
  | 'vegan'
  | 'healthy';

export type DrinkCategory =
  | 'milkshakes'
  | 'smoothies'
  | 'mocktails'
  | 'cocktails'
  | 'coffee'
  | 'tea'
  | 'lemonades'
  | 'traditional';

export type RecipeCategory = FoodCategory | DrinkCategory;

export type Difficulty = 'easy' | 'medium' | 'hard';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  salt?: number;
  fiber?: number;
};

export type Ingredient = {
  /** Stable id so shopping-list merging can deduplicate reliably. */
  id: string;
  name: Localized;
  /** Numeric amount for 1 batch of `servings`; null for "to taste". */
  amount: number | null;
  unit: Localized | null;
  /** Shopping-list bucket. */
  aisle: ShoppingCategory;
  optional?: boolean;
};

export type Recipe = {
  id: string;
  slug: string;
  group: RecipeGroup;
  categories: RecipeCategory[];
  title: Localized;
  description: Localized;
  cuisine: string; // cuisine id
  /** Optional remote photo; when absent the UI renders generated food art. */
  image?: string;
  /** Emoji used by the generated artwork + compact lists. */
  emoji: string;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: Difficulty;
  servings: number;
  /** Per serving. */
  nutrition: Nutrition;
  ingredients: Ingredient[];
  steps: LocalizedList;
  tips: LocalizedList;
  allergens: AllergenId[];
  substitutions: { for: Localized; use: Localized }[];
  healthierVariant: Localized;
  tags: DietTag[];
  budget: 'low' | 'medium' | 'high';
  mealSlots: MealSlot[];
  rating?: number;
};

export type DietTag =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'lactose-free'
  | 'high-protein'
  | 'low-calorie'
  | 'quick'
  | 'halal';

export type AllergenId =
  | 'gluten'
  | 'lactose'
  | 'eggs'
  | 'nuts'
  | 'peanuts'
  | 'fish'
  | 'shellfish'
  | 'soy'
  | 'sesame'
  | 'alcohol'
  | 'celery'
  | 'mustard';

export type RecipeFilters = {
  query: string;
  maxTotalMinutes?: number;
  maxCalories?: number;
  difficulty?: Difficulty;
  diets: DietTag[];
  budget?: 'low' | 'medium' | 'high';
  cuisine?: string;
  mealSlot?: MealSlot;
  /** Free-text list of what the user has at home. */
  pantry: string[];
};

/* -------------------------------------------------------------------------- */
/* Cuisines                                                                    */
/* -------------------------------------------------------------------------- */

export type Cuisine = {
  id: string;
  name: Localized;
  flag: string;
  emoji: string;
  description: Localized;
  staples: LocalizedList;
  signatureDishes: { name: string; note: Localized }[];
  /** Gradient used by the generated card artwork. */
  gradient: [string, string];
};

/* -------------------------------------------------------------------------- */
/* Photo analysis                                                              */
/* -------------------------------------------------------------------------- */

export type PhotoAnalysis = {
  id: string;
  createdAt: number;
  /** Data URL kept locally so history thumbnails survive a refresh. */
  thumbnail?: string;
  dish: string;
  kind: 'food' | 'drink' | 'unknown';
  confidence: number; // 0..1
  portion: string;
  ingredients: string[];
  nutrition: Nutrition;
  healthScore: number; // 0..100
  benefits: string[];
  watchOuts: string[];
  frequency: string;
  problematic: string[];
  healthierSuggestions: string[];
  summary: string;
  demo?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Meal plan                                                                   */
/* -------------------------------------------------------------------------- */

export type Sex = 'female' | 'male' | 'unspecified';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type PlanGoal =
  | 'maintain'
  | 'gain'
  | 'lose'
  | 'muscle'
  | 'healthier';

export type PlannerInput = {
  age: number;
  heightCm: number;
  weightKg: number;
  sex: Sex;
  activity: ActivityLevel;
  goal: PlanGoal;
  mealsPerDay: number;
  allergies: string[];
  intolerances: string[];
  excluded: string[];
  disliked: string[];
  favoriteCuisines: string[];
  favoriteFoods: string[];
  budget: 'low' | 'medium' | 'high';
  cookingMinutes: number;
  equipment: string[];
  days: number;
  diets: DietTag[];
};

export type PlanMeal = {
  id: string;
  slot: MealSlot | 'snack2';
  title: string;
  description: string;
  quantity: string;
  nutrition: Nutrition;
  alternatives: string[];
  recipeId?: string;
};

export type PlanDay = {
  id: string;
  /** 0 = Monday. */
  dayIndex: number;
  label: string;
  meals: PlanMeal[];
  totals: Nutrition;
  waterMl: number;
};

export type MealPlan = {
  id: string;
  createdAt: number;
  title: string;
  goal: PlanGoal;
  targetCalories: number;
  macroTargets: { protein: number; carbs: number; fat: number };
  days: PlanDay[];
  notes: string[];
  input: PlannerInput;
  demo?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Shopping list                                                               */
/* -------------------------------------------------------------------------- */

export type ShoppingCategory =
  | 'produce'
  | 'meat-fish'
  | 'dairy'
  | 'grains'
  | 'spices'
  | 'drinks'
  | 'frozen'
  | 'other';

export type ShoppingItem = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  category: ShoppingCategory;
  checked: boolean;
  source?: string;
  addedAt: number;
};

/* -------------------------------------------------------------------------- */
/* AI chat                                                                     */
/* -------------------------------------------------------------------------- */

export type AgentId = 'chef' | 'nutrition' | 'cuisine';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** Data URL of an attached image (user messages only). */
  image?: string;
  demo?: boolean;
  error?: boolean;
};

export type Conversation = {
  id: string;
  agent: AgentId;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

/* -------------------------------------------------------------------------- */
/* User & profile                                                              */
/* -------------------------------------------------------------------------- */

export type AuthProvider = 'password' | 'demo';

export type User = {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: AuthProvider;
  createdAt: number;
  /** True when the account lives on the server and its data syncs across devices. */
  synced?: boolean;
};

export type UserProfile = {
  locale: Locale;
  theme: ThemeMode;
  allergies: string[];
  intolerances: string[];
  disliked: string[];
  favoriteFoods: string[];
  favoriteCuisines: string[];
  goal: PlanGoal | null;
  maxCookingMinutes: number | null;
  diets: DietTag[];
  onboarded: boolean;
  /** Auto-generated natural-language context handed to every agent. */
  aiContext: string;
};

export type SearchHistoryEntry = {
  id: string;
  query: string;
  group: RecipeGroup | null;
  category: RecipeCategory | null;
  createdAt: number;
};

/** Everything persisted for the signed-in (or guest) user. */
export type AppData = {
  profile: UserProfile;
  favorites: string[];
  savedRecipes: Recipe[];
  plans: MealPlan[];
  analyses: PhotoAnalysis[];
  conversations: Conversation[];
  shoppingList: ShoppingItem[];
  exploredCuisines: string[];
  searches: SearchHistoryEntry[];
};
