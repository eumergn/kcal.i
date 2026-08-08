/**
 * Shared per-100g nutrition/price reference - same real values used by the engine
 * (engine/src/sampleData.ts, cheapest FR store price). Meal items reference a food
 * by id + grams rather than duplicating these facts per meal instance.
 */
export type FoodCatalogEntry = {
  id: string;
  name: string;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  pricePer100: number;
};

export const foodCatalog: FoodCatalogEntry[] = [
  { id: 'chicken-breast', name: 'Chicken breast', caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, pricePer100: 0.95 },
  { id: 'oats', name: 'Oats', caloriesPer100: 389, proteinPer100: 17, carbsPer100: 66, fatPer100: 7, pricePer100: 0.28 },
  { id: 'carrots', name: 'Carrots', caloriesPer100: 41, proteinPer100: 0.9, carbsPer100: 10, fatPer100: 0.2, pricePer100: 0.08 },
  { id: 'tuna-canned', name: 'Canned tuna', caloriesPer100: 116, proteinPer100: 26, carbsPer100: 0, fatPer100: 1, pricePer100: 1.1 },
  { id: 'bread', name: 'Whole grain bread', caloriesPer100: 247, proteinPer100: 13, carbsPer100: 41, fatPer100: 4.2, pricePer100: 0.35 },
  { id: 'ground-beef', name: 'Ground beef', caloriesPer100: 137, proteinPer100: 21, carbsPer100: 0, fatPer100: 5, pricePer100: 1.5 },
  { id: 'rice', name: 'White rice', caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, pricePer100: 0.1 },
  { id: 'eggs', name: 'Eggs', caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1.1, fatPer100: 11, pricePer100: 0.28 },
  { id: 'pasta', name: 'Whole wheat pasta', caloriesPer100: 124, proteinPer100: 5, carbsPer100: 25, fatPer100: 1.1, pricePer100: 0.15 },
];

export function getFood(id: string): FoodCatalogEntry {
  const food = foodCatalog.find((f) => f.id === id);
  if (!food) throw new Error(`Unknown food id: ${id}`);
  return food;
}
