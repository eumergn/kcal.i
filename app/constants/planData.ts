import { FoodCatalogEntry } from './foodCatalog';

/**
 * Placeholder plan data - itemized per food so meals can be inspected/edited (add,
 * remove, adjust grams) rather than being flat pre-computed numbers. Values match the
 * actual engine output for a sample profile (engine/src/runExample.ts). Once the Edge
 * Function is wired up, this becomes a real API response instead of a static object.
 */
export type MealItem = {
  id: string; // unique instance id (not the same as foodId - a meal can't have two rows for one food)
  foodId: string;
  grams: number;
};

export type Meal = {
  id: string;
  time: string;
  name: string;
  items: MealItem[];
  eaten: boolean;
};

export const initialMeals: Meal[] = [
  {
    id: 'breakfast', time: '08:00', name: 'Breakfast', eaten: true,
    items: [
      { id: 'b-chicken', foodId: 'chicken-breast', grams: 140 },
      { id: 'b-oats', foodId: 'oats', grams: 60 },
      { id: 'b-carrots', foodId: 'carrots', grams: 100 },
    ],
  },
  {
    id: 'lunch', time: '12:30', name: 'Lunch', eaten: true,
    items: [
      { id: 'l-tuna', foodId: 'tuna-canned', grams: 120 },
      { id: 'l-bread', foodId: 'bread', grams: 100 },
      { id: 'l-carrots', foodId: 'carrots', grams: 100 },
    ],
  },
  {
    id: 'snack', time: '16:30', name: 'Snack', eaten: false,
    items: [
      { id: 's-beef', foodId: 'ground-beef', grams: 200 },
      { id: 's-rice', foodId: 'rice', grams: 160 },
      { id: 's-carrots', foodId: 'carrots', grams: 100 },
    ],
  },
  {
    id: 'dinner', time: '19:30', name: 'Dinner', eaten: false,
    items: [
      { id: 'd-eggs', foodId: 'eggs', grams: 250 },
      { id: 'd-pasta', foodId: 'pasta', grams: 170 },
      { id: 'd-carrots', foodId: 'carrots', grams: 100 },
    ],
  },
];

export const targets = {
  goal: 'Cut',
  calories: 2192,
  proteinG: 176,
  carbsG: 235,
  fatG: 61,
  budget: 10,
  currency: 'EUR',
};

export function mealTotals(items: MealItem[], catalog: FoodCatalogEntry[]) {
  return items.reduce(
    (acc, item) => {
      const food = catalog.find((f) => f.id === item.foodId);
      if (!food) return acc; // scanned/removed food no longer in catalog - skip rather than crash
      const factor = item.grams / 100;
      return {
        calories: acc.calories + food.caloriesPer100 * factor,
        proteinG: acc.proteinG + food.proteinPer100 * factor,
        carbsG: acc.carbsG + food.carbsPer100 * factor,
        fatG: acc.fatG + food.fatPer100 * factor,
        cost: acc.cost + food.pricePer100 * factor,
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, cost: 0 },
  );
}
