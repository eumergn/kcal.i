/**
 * Placeholder monthly grocery data - quantities are the daily meal-plan grams
 * (from planData.ts's meal descriptions) scaled to ~30 days. Prices are the cheapest
 * FR store price per 100g from engine/src/sampleData.ts. All illustrative until the
 * real engine/backend is wired up - see README.
 */
export type GroceryItem = {
  id: string;
  name: string;
  /** Total grams needed for the month, at the current meal plan's daily portions. */
  neededGrams: number;
  /** Editable - the user updates this if they find a cheaper price. */
  pricePer100: number;
  /** How many grams have actually been bought so far this month. */
  purchasedGrams: number;
};

export const initialGroceryItems: GroceryItem[] = [
  { id: 'chicken-breast', name: 'Chicken breast', neededGrams: 3000, pricePer100: 0.95, purchasedGrams: 1200 },
  { id: 'oats', name: 'Oats', neededGrams: 2130, pricePer100: 0.28, purchasedGrams: 2130 },
  { id: 'carrots', name: 'Carrots', neededGrams: 14400, pricePer100: 0.08, purchasedGrams: 6000 },
  { id: 'tuna-canned', name: 'Canned tuna', neededGrams: 3240, pricePer100: 1.1, purchasedGrams: 1080 },
  { id: 'bread', name: 'Whole grain bread', neededGrams: 3420, pricePer100: 0.35, purchasedGrams: 1710 },
  { id: 'ground-beef', name: 'Ground beef', neededGrams: 5490, pricePer100: 1.5, purchasedGrams: 0 },
  { id: 'rice', name: 'White rice', neededGrams: 5010, pricePer100: 0.1, purchasedGrams: 5010 },
  { id: 'eggs', name: 'Eggs', neededGrams: 7890, pricePer100: 0.28, purchasedGrams: 3945 },
  { id: 'pasta', name: 'Whole wheat pasta', neededGrams: 5250, pricePer100: 0.15, purchasedGrams: 0 },
];

/** Normalizes whatever period the user set their budget in during onboarding
 * (daily/weekly/monthly) to a single monthly figure for display and progress math. */
export function normalizeToMonthly(amount: number, period: 'daily' | 'weekly' | 'monthly'): number {
  if (period === 'daily') return amount * 30;
  if (period === 'weekly') return amount * (52 / 12);
  return amount;
}

export function formatGrams(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`;
}

export function itemCost(item: GroceryItem, grams: number): number {
  return (grams / 100) * item.pricePer100;
}
