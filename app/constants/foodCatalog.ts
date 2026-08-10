import { Food, foods, priceForCountry } from './foods';

/**
 * Flat per-100g nutrition/price shape meal rows, mealTotals, and the meal-detail
 * "Add food" list actually need - derived from the tagged foods.ts roster (which also
 * carries category/diet/allergen/fiber data the meal-plan engine needs but this
 * simpler shape doesn't). A scanned barcode product becomes one of these too, with no
 * category/diet tags of its own - so this stays the lowest-common-denominator shape.
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

export function toCatalogEntry(food: Food, country: 'FR' | 'DE'): FoodCatalogEntry {
  return {
    id: food.id,
    name: food.name,
    caloriesPer100: food.caloriesPer100,
    proteinPer100: food.proteinPer100,
    carbsPer100: food.carbsPer100,
    fatPer100: food.fatPer100,
    pricePer100: priceForCountry(food, country),
  };
}

export function buildFoodCatalog(country: 'FR' | 'DE'): FoodCatalogEntry[] {
  return foods.map((food) => toCatalogEntry(food, country));
}

/** Placeholder-country fallback for screens rendered before the profile loads. */
export const foodCatalog: FoodCatalogEntry[] = buildFoodCatalog('FR');
