import { DietType } from '@/context/ProfileContext';
import { Food, FoodCategory, foods, priceForCountry } from '@/constants/foods';
import { Meal } from '@/constants/planData';

/**
 * Ported from the standalone engine/ prototype (engine/src/planner.ts) into the app
 * proper, adapted in two ways: it takes pre-computed protein/carb targets instead of
 * calculating its own (lib/nutrition.ts's computeTargets is the one real, already-live
 * targets formula - Home and every other screen use it, so the meal plan has to use
 * the same numbers or its totals won't match what Home displays), and foods carry one
 * price per country instead of a multi-store list (foods.ts has no per-store data, so
 * that layer of the original engine was dead weight here).
 */
export type PlannedItem = {
  foodId: string;
  grams: number;
  cost: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type MealSlot = {
  name: string;
  time: string;
  items: PlannedItem[];
  cost: number;
};

export type MealPlanProfile = {
  country: 'FR' | 'DE';
  dietType: DietType;
  allergies: string[];
  dislikedFoodIds: string[];
  mealsPerDay: number;
};

const PROTEIN_CATEGORIES: FoodCategory[] = [
  'chicken', 'beef', 'fish', 'eggs', 'dairy', 'protein_product', 'beans', 'lentils',
];
const CARB_CATEGORIES: FoodCategory[] = ['rice', 'pasta', 'potatoes', 'oats', 'bread'];
const PRODUCE_CATEGORIES: FoodCategory[] = ['vegetables', 'fruits'];

const PRODUCE_GRAMS = 120; // fixed small produce portion per meal, for fiber/micronutrients
const MAX_ITEM_GRAMS = 350; // sanity cap so a low-density food can't inflate into an absurd portion

const MEAL_SCHEDULE: Record<number, { name: string; time: string }[]> = {
  2: [{ name: 'Breakfast', time: '08:00' }, { name: 'Dinner', time: '19:00' }],
  3: [
    { name: 'Breakfast', time: '08:00' },
    { name: 'Lunch', time: '12:30' },
    { name: 'Dinner', time: '19:00' },
  ],
  4: [
    { name: 'Breakfast', time: '08:00' },
    { name: 'Lunch', time: '12:30' },
    { name: 'Snack', time: '16:30' },
    { name: 'Dinner', time: '19:30' },
  ],
  5: [
    { name: 'Breakfast', time: '08:00' },
    { name: 'Lunch', time: '12:30' },
    { name: 'Snack', time: '16:00' },
    { name: 'Dinner', time: '19:30' },
    { name: 'Evening Snack', time: '21:30' },
  ],
  6: [
    { name: 'Breakfast', time: '07:30' },
    { name: 'Snack', time: '10:00' },
    { name: 'Lunch', time: '12:30' },
    { name: 'Snack', time: '16:00' },
    { name: 'Dinner', time: '19:00' },
    { name: 'Evening Snack', time: '21:30' },
  ],
};

function isEligible(food: Food, profile: MealPlanProfile): boolean {
  if (!food.dietCompatible.includes(profile.dietType)) return false;
  if (food.allergens.some((a) => profile.allergies.includes(a))) return false;
  if (profile.dislikedFoodIds.includes(food.id)) return false;
  return true;
}

/**
 * Rank by macro *density* (grams of the target macro per 100g of food), not macro-per-cost.
 * Cost-per-gram-of-protein alone favours legumes over lean protein: chickpeas are cheaper
 * per gram of protein than chicken, but at only 9g protein/100g, hitting a 44g protein
 * target from chickpeas alone needs ~490g - dragging in far more carbs/calories than
 * intended. Density-first keeps portions realistic; cost only breaks near-ties.
 */
function pickFood(
  eligible: Food[],
  categories: FoodCategory[],
  macroField: 'proteinPer100' | 'carbsPer100',
  usageCount: Record<string, number>,
  country: 'FR' | 'DE',
): Food | undefined {
  const candidates = eligible.filter((f) => categories.includes(f.category));
  if (candidates.length === 0) return undefined;

  const ranked = [...candidates].sort((a, b) => {
    const usageA = usageCount[a.id] ?? 0;
    const usageB = usageCount[b.id] ?? 0;
    if (usageA !== usageB) return usageA - usageB; // least-used-so-far first, for variety

    const densityDiff = b[macroField] - a[macroField];
    if (Math.abs(densityDiff) > 2) return densityDiff; // denser food wins outright

    return priceForCountry(a, country) - priceForCountry(b, country); // near-tie: cheaper wins
  });
  return ranked[0];
}

function buildItem(food: Food, gramsRequested: number, country: 'FR' | 'DE'): PlannedItem {
  const grams = Math.min(gramsRequested, MAX_ITEM_GRAMS);
  const factor = grams / 100;
  return {
    foodId: food.id,
    grams: Math.round(grams),
    cost: Number((priceForCountry(food, country) * factor).toFixed(2)),
    calories: Math.round(food.caloriesPer100 * factor),
    proteinG: Math.round(food.proteinPer100 * factor),
    carbsG: Math.round(food.carbsPer100 * factor),
    fatG: Math.round(food.fatPer100 * factor),
  };
}

function sumMeal(name: string, time: string, items: PlannedItem[]): MealSlot {
  return { name, time, items, cost: Number(items.reduce((s, i) => s + i.cost, 0).toFixed(2)) };
}

/**
 * Greedy budget-repair pass: while total cost exceeds budget, find the single
 * item-swap (same category, cheaper eligible alternative) that saves the most
 * money, apply it, repeat. Not a true optimizer, but converges fast and stays
 * legible - good enough until a heuristic proves insufficient in practice.
 */
function repairBudget(meals: MealSlot[], eligible: Food[], budget: number, country: 'FR' | 'DE'): MealSlot[] {
  const foodById = new Map(eligible.map((f) => [f.id, f]));
  let totalCost = meals.reduce((s, m) => s + m.cost, 0);
  let iterations = 0;

  while (totalCost > budget && iterations < 50) {
    iterations++;
    let bestSaving = 0;
    let bestMealIdx = -1;
    let bestItemIdx = -1;
    let bestReplacement: Food | undefined;

    meals.forEach((meal, mi) => {
      meal.items.forEach((item, ii) => {
        const currentFood = foodById.get(item.foodId);
        if (!currentFood) return;
        const sameCategory = eligible.filter((f) => f.category === currentFood.category && f.id !== currentFood.id);
        sameCategory.forEach((alt) => {
          const saving = (priceForCountry(currentFood, country) - priceForCountry(alt, country)) * (item.grams / 100);
          if (saving > bestSaving) {
            bestSaving = saving;
            bestMealIdx = mi;
            bestItemIdx = ii;
            bestReplacement = alt;
          }
        });
      });
    });

    if (!bestReplacement || bestSaving <= 0) break; // no more profitable swaps

    const meal = meals[bestMealIdx];
    const oldItem = meal.items[bestItemIdx];
    meal.items[bestItemIdx] = buildItem(bestReplacement, oldItem.grams, country);
    meals[bestMealIdx] = sumMeal(meal.name, meal.time, meal.items);
    totalCost = meals.reduce((s, m) => s + m.cost, 0);
  }

  return meals;
}

/**
 * Solve for both items' portions simultaneously instead of sizing each to its own macro
 * target independently. Sizing sequentially double-counts: carb-dense foods like oats
 * (17g protein/100g) or bread (13g/100g) also contribute real protein, so a protein item
 * sized to the *full* protein target plus a carb item sized to the *full* carb target
 * systematically overshoots both. This solves the 2x2 system so the combined total lands
 * on target instead.
 */
function solveTwoItemGrams(
  proteinFood: Food,
  carbFood: Food,
  targetProteinG: number,
  targetCarbsG: number,
): { proteinGrams: number; carbGrams: number } {
  const pP = proteinFood.proteinPer100 / 100;
  const pC = proteinFood.carbsPer100 / 100;
  const cP = carbFood.proteinPer100 / 100;
  const cC = carbFood.carbsPer100 / 100;
  const targetP = Math.max(targetProteinG, 0);
  const targetC = Math.max(targetCarbsG, 0);

  const det = pP * cC - cP * pC;
  if (Math.abs(det) > 1e-6) {
    const proteinGrams = (targetP * cC - cP * targetC) / det;
    const carbGrams = (pP * targetC - targetP * pC) / det;
    if (proteinGrams >= 0 && carbGrams >= 0 && Number.isFinite(proteinGrams) && Number.isFinite(carbGrams)) {
      return { proteinGrams, carbGrams };
    }
  }

  // Degenerate system (e.g. near-parallel macro ratios) - fall back to independent sizing.
  return {
    proteinGrams: targetP / (pP || 1),
    carbGrams: targetC / (cC || 1),
  };
}

export function generateMealPlan(
  profile: MealPlanProfile,
  targets: { proteinG: number; carbsG: number },
  budgetForDay: number,
): MealSlot[] {
  const eligible = foods.filter((f) => isEligible(f, profile));
  const country = profile.country;

  const mealCount = Math.min(Math.max(profile.mealsPerDay, 2), 6);
  const schedule = MEAL_SCHEDULE[mealCount];

  const perMealProtein = targets.proteinG / mealCount;
  const perMealCarbs = targets.carbsG / mealCount;

  const usageCount: Record<string, number> = {};
  const useFood = (id: string) => {
    usageCount[id] = (usageCount[id] ?? 0) + 1;
  };

  const meals: MealSlot[] = schedule.map(({ name, time }) => {
    const items: PlannedItem[] = [];

    const produce = eligible.filter((f) => PRODUCE_CATEGORIES.includes(f.category));
    const produceItem = produce.length
      ? buildItem([...produce].sort((a, b) => priceForCountry(a, country) - priceForCountry(b, country))[0], PRODUCE_GRAMS, country)
      : undefined;

    const proteinFood = pickFood(eligible, PROTEIN_CATEGORIES, 'proteinPer100', usageCount, country);
    const carbFood = pickFood(eligible, CARB_CATEGORIES, 'carbsPer100', usageCount, country);

    const remainingProtein = perMealProtein - (produceItem?.proteinG ?? 0);
    const remainingCarbs = perMealCarbs - (produceItem?.carbsG ?? 0);

    if (proteinFood && carbFood) {
      const { proteinGrams, carbGrams } = solveTwoItemGrams(proteinFood, carbFood, remainingProtein, remainingCarbs);
      items.push(buildItem(proteinFood, proteinGrams, country));
      items.push(buildItem(carbFood, carbGrams, country));
      useFood(proteinFood.id);
      useFood(carbFood.id);
    } else if (proteinFood) {
      items.push(buildItem(proteinFood, remainingProtein / (proteinFood.proteinPer100 / 100 || 1), country));
      useFood(proteinFood.id);
    } else if (carbFood) {
      items.push(buildItem(carbFood, remainingCarbs / (carbFood.carbsPer100 / 100 || 1), country));
      useFood(carbFood.id);
    }

    if (produceItem) items.push(produceItem);

    return sumMeal(name, time, items);
  });

  return repairBudget(meals, eligible, budgetForDay, country);
}

/** Adapts engine output into the app's own editable Meal/MealItem shape - drops the
 * engine's own per-meal totals since mealTotals() already recomputes those from the
 * catalog, so nothing downstream needs to trust two separate sources of truth. */
export function mealSlotsToMeals(mealSlots: MealSlot[]): Meal[] {
  return mealSlots.map((slot, i) => ({
    id: `meal-${i}`,
    time: slot.time,
    name: slot.name,
    eaten: false,
    items: slot.items.map((item, j) => ({
      id: `${item.foodId}-${i}-${j}`,
      foodId: item.foodId,
      grams: item.grams,
    })),
  }));
}
