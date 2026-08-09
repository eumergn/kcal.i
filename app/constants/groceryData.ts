/**
 * Grocery quantities are the daily meal-plan grams (from planData.ts's meal
 * descriptions) scaled to ~30 days. Prices are informed estimates of typical French
 * and German supermarket price ranges (budget/discount vs premium/quality tier),
 * not a live scraped feed - there's no market-price API wired up, so this is the
 * honest ceiling of what a static dataset can offer. Update ITEM_PRICING if better
 * sourced numbers become available.
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

const NEEDED_GRAMS: Record<string, number> = {
  'chicken-breast': 3000,
  oats: 2130,
  carrots: 14400,
  'tuna-canned': 3240,
  bread: 3420,
  'ground-beef': 5490,
  rice: 5010,
  eggs: 7890,
  pasta: 5250,
};

const ITEM_NAMES: Record<string, string> = {
  'chicken-breast': 'Chicken breast',
  oats: 'Oats',
  carrots: 'Carrots',
  'tuna-canned': 'Canned tuna',
  bread: 'Whole grain bread',
  'ground-beef': 'Ground beef',
  rice: 'White rice',
  eggs: 'Eggs',
  pasta: 'Whole wheat pasta',
};

export type PriceTier = 'budget' | 'premium';
export type GroceryCountry = 'FR' | 'DE';

/**
 * EUR per 100g, budget (discount-store) vs premium (quality/organic-leaning) tier,
 * per country. France runs consistently higher than Germany for groceries generally -
 * a well-documented gap, not a rounding choice. Germany's discount grocers (Lidl,
 * Aldi) set an unusually low budget floor that France's market doesn't match.
 */
const ITEM_PRICING: Record<string, Record<GroceryCountry, Record<PriceTier, number>>> = {
  'chicken-breast': { FR: { budget: 0.9, premium: 1.6 }, DE: { budget: 0.75, premium: 1.35 } },
  oats: { FR: { budget: 0.25, premium: 0.55 }, DE: { budget: 0.2, premium: 0.45 } },
  carrots: { FR: { budget: 0.09, premium: 0.22 }, DE: { budget: 0.07, premium: 0.18 } },
  'tuna-canned': { FR: { budget: 1.0, premium: 2.2 }, DE: { budget: 0.85, premium: 1.9 } },
  bread: { FR: { budget: 0.35, premium: 0.75 }, DE: { budget: 0.28, premium: 0.6 } },
  'ground-beef': { FR: { budget: 1.3, premium: 2.4 }, DE: { budget: 1.1, premium: 2.1 } },
  rice: { FR: { budget: 0.15, premium: 0.4 }, DE: { budget: 0.12, premium: 0.35 } },
  eggs: { FR: { budget: 0.3, premium: 0.55 }, DE: { budget: 0.25, premium: 0.45 } },
  pasta: { FR: { budget: 0.18, premium: 0.42 }, DE: { budget: 0.15, premium: 0.38 } },
};

const ITEM_IDS = Object.keys(NEEDED_GRAMS);

/** Per-item budget/premium prices for one country - the shape the research Edge
 * Function returns and caches, and what the static ITEM_PRICING table provides as a
 * fallback when live research hasn't run (or failed) for that country yet. */
export type CountryPriceTable = Record<string, Record<PriceTier, number>>;

export function staticPriceTable(country: GroceryCountry): CountryPriceTable {
  const table: CountryPriceTable = {};
  for (const id of ITEM_IDS) table[id] = ITEM_PRICING[id][country];
  return table;
}

export function priceFor(table: CountryPriceTable, itemId: string, tier: PriceTier): number {
  return table[itemId]?.[tier] ?? 0.5;
}

/** Totals the full list at a given tier, to compare against the user's budget. */
export function totalAtTier(table: CountryPriceTable, tier: PriceTier): number {
  return ITEM_IDS.reduce((sum, id) => sum + (NEEDED_GRAMS[id] / 100) * priceFor(table, id, tier), 0);
}

/** Premium if the budget comfortably covers it, budget tier otherwise - "cheapest
 * when the budget is tight, best quality when it isn't", as requested. */
export function selectPriceTier(monthlyBudget: number, table: CountryPriceTable): PriceTier {
  return monthlyBudget >= totalAtTier(table, 'premium') ? 'premium' : 'budget';
}

export function buildInitialGroceryItems(table: CountryPriceTable, tier: PriceTier): GroceryItem[] {
  return ITEM_IDS.map((id) => ({
    id,
    name: ITEM_NAMES[id],
    neededGrams: NEEDED_GRAMS[id],
    pricePer100: priceFor(table, id, tier),
    purchasedGrams: 0,
  }));
}

/** Placeholder-country fallback for screens rendered before the profile loads. */
export const initialGroceryItems: GroceryItem[] = buildInitialGroceryItems(staticPriceTable('FR'), 'budget');

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
