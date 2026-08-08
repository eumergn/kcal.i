export type Sex = 'male' | 'female';
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';
export type Goal = 'bulk' | 'cut' | 'maintain' | 'recomposition' | 'performance';
export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'kosher';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

export interface UserProfile {
  ageYears: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  country: 'FR' | 'DE';
  activityLevel: ActivityLevel;
  goal: Goal;
  dietType: DietType;
  allergies: string[];
  dislikedFoodIds: string[];
  mealsPerDay: number;
  budgetAmount: number;
  budgetPeriod: BudgetPeriod;
  currency: string;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export type FoodCategory =
  | 'chicken' | 'beef' | 'fish' | 'eggs' | 'dairy' | 'rice' | 'pasta'
  | 'potatoes' | 'oats' | 'bread' | 'beans' | 'lentils' | 'vegetables'
  | 'fruits' | 'nuts' | 'protein_product';

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
  dietCompatible: DietType[];
  allergens: string[];
}

export interface StorePrice {
  storeName: string;
  pricePer100: number; // price for 100g/100ml of this food, in the food's currency
}

export interface FoodWithPrices extends Food {
  prices: StorePrice[]; // one entry per store that stocks it
}

export interface PlannedItem {
  food: FoodWithPrices;
  grams: number;
  cheapestStore: string;
  cost: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealSlot {
  name: string;
  time: string;
  items: PlannedItem[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  cost: number;
}

export interface DailyPlan {
  targets: NutritionTargets;
  budgetForDay: number;
  currency: string;
  meals: MealSlot[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    cost: number;
  };
}
