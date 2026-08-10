import { DietType } from '@/context/ProfileContext';

export type FoodCategory =
  | 'chicken' | 'beef' | 'fish' | 'eggs' | 'dairy' | 'rice' | 'pasta'
  | 'potatoes' | 'oats' | 'bread' | 'beans' | 'lentils' | 'vegetables'
  | 'fruits' | 'nuts' | 'protein_product';

/**
 * The real, tagged food roster (category/diet/allergens/fiber) used by the meal-plan
 * engine (lib/mealPlanner.ts) - originally prototyped in engine/src/sampleData.ts and
 * brought into the app proper here. priceFR is the cheapest-store price researched
 * there; priceDE follows the same ~0.82x FR-to-DE ratio already established in
 * groceryData.ts's budget tier (Germany's discount grocers set a lower floor than
 * France's market) for the 9 foods that don't already have a directly researched DE
 * price from groceryData.ts.
 */
export type Food = {
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
  priceFR: number;
  priceDE: number;
};

export const foods: Food[] = [
  {
    id: 'chicken-breast', name: 'Chicken breast', category: 'chicken',
    caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0,
    dietCompatible: ['omnivore', 'halal', 'kosher'], allergens: [],
    priceFR: 0.90, priceDE: 0.75,
  },
  {
    id: 'eggs', name: 'Eggs', category: 'eggs',
    caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1.1, fatPer100: 11, fiberPer100: 0,
    dietCompatible: ['omnivore', 'vegetarian', 'pescatarian'], allergens: ['egg'],
    priceFR: 0.30, priceDE: 0.25,
  },
  {
    id: 'greek-yogurt', name: 'Greek yogurt (plain)', category: 'dairy',
    caloriesPer100: 59, proteinPer100: 10, carbsPer100: 3.6, fatPer100: 0.4, fiberPer100: 0,
    dietCompatible: ['omnivore', 'vegetarian', 'pescatarian'], allergens: ['dairy'],
    priceFR: 0.30, priceDE: 0.25,
  },
  {
    id: 'tuna-canned', name: 'Canned tuna (in water)', category: 'fish',
    caloriesPer100: 116, proteinPer100: 26, carbsPer100: 0, fatPer100: 1, fiberPer100: 0,
    dietCompatible: ['omnivore', 'pescatarian'], allergens: ['fish'],
    priceFR: 1.00, priceDE: 0.85,
  },
  {
    id: 'ground-beef', name: 'Ground beef (5% fat)', category: 'beef',
    caloriesPer100: 137, proteinPer100: 21, carbsPer100: 0, fatPer100: 5, fiberPer100: 0,
    dietCompatible: ['omnivore'], allergens: [],
    priceFR: 1.30, priceDE: 1.10,
  },
  {
    id: 'cottage-cheese', name: 'Cottage cheese', category: 'dairy',
    caloriesPer100: 98, proteinPer100: 11, carbsPer100: 3.4, fatPer100: 4.3, fiberPer100: 0,
    dietCompatible: ['omnivore', 'vegetarian', 'pescatarian'], allergens: ['dairy'],
    priceFR: 0.55, priceDE: 0.45,
  },
  {
    id: 'tofu', name: 'Firm tofu', category: 'protein_product',
    caloriesPer100: 144, proteinPer100: 15, carbsPer100: 3, fatPer100: 8, fiberPer100: 1.2,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'], allergens: ['soy'],
    priceFR: 0.70, priceDE: 0.57,
  },
  {
    id: 'lentils', name: 'Lentils (cooked)', category: 'lentils',
    caloriesPer100: 116, proteinPer100: 9, carbsPer100: 20, fatPer100: 0.4, fiberPer100: 7.9,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.18, priceDE: 0.15,
  },
  {
    id: 'chickpeas', name: 'Chickpeas (cooked)', category: 'beans',
    caloriesPer100: 164, proteinPer100: 9, carbsPer100: 27, fatPer100: 2.6, fiberPer100: 7.6,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.17, priceDE: 0.14,
  },
  {
    id: 'rice', name: 'White rice (cooked)', category: 'rice',
    caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.15, priceDE: 0.12,
  },
  {
    id: 'oats', name: 'Oats (dry)', category: 'oats',
    caloriesPer100: 389, proteinPer100: 17, carbsPer100: 66, fatPer100: 7, fiberPer100: 10.6,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: ['gluten'],
    priceFR: 0.25, priceDE: 0.20,
  },
  {
    id: 'potatoes', name: 'Potatoes (boiled)', category: 'potatoes',
    caloriesPer100: 87, proteinPer100: 1.9, carbsPer100: 20, fatPer100: 0.1, fiberPer100: 1.8,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.10, priceDE: 0.08,
  },
  {
    id: 'pasta', name: 'Whole wheat pasta (cooked)', category: 'pasta',
    caloriesPer100: 124, proteinPer100: 5, carbsPer100: 25, fatPer100: 1.1, fiberPer100: 3.5,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'], allergens: ['gluten'],
    priceFR: 0.18, priceDE: 0.15,
  },
  {
    id: 'bread', name: 'Whole grain bread', category: 'bread',
    caloriesPer100: 247, proteinPer100: 13, carbsPer100: 41, fatPer100: 4.2, fiberPer100: 7,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'], allergens: ['gluten'],
    priceFR: 0.35, priceDE: 0.28,
  },
  {
    id: 'banana', name: 'Banana', category: 'fruits',
    caloriesPer100: 89, proteinPer100: 1.1, carbsPer100: 23, fatPer100: 0.3, fiberPer100: 2.6,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.18, priceDE: 0.15,
  },
  {
    id: 'apple', name: 'Apple', category: 'fruits',
    caloriesPer100: 52, proteinPer100: 0.3, carbsPer100: 14, fatPer100: 0.2, fiberPer100: 2.4,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.20, priceDE: 0.16,
  },
  {
    id: 'frozen-veg', name: 'Frozen mixed vegetables', category: 'vegetables',
    caloriesPer100: 65, proteinPer100: 3, carbsPer100: 13, fatPer100: 0.5, fiberPer100: 4,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.15, priceDE: 0.12,
  },
  {
    id: 'carrots', name: 'Carrots', category: 'vegetables',
    caloriesPer100: 41, proteinPer100: 0.9, carbsPer100: 10, fatPer100: 0.2, fiberPer100: 2.8,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.09, priceDE: 0.07,
  },
  {
    id: 'spinach', name: 'Spinach', category: 'vegetables',
    caloriesPer100: 23, proteinPer100: 2.9, carbsPer100: 3.6, fatPer100: 0.4, fiberPer100: 2.2,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    priceFR: 0.30, priceDE: 0.25,
  },
  {
    id: 'milk', name: 'Milk (semi-skimmed)', category: 'dairy',
    caloriesPer100: 46, proteinPer100: 3.4, carbsPer100: 4.8, fatPer100: 1.6, fiberPer100: 0,
    dietCompatible: ['omnivore', 'vegetarian', 'pescatarian'], allergens: ['dairy'],
    priceFR: 0.09, priceDE: 0.07,
  },
];

export function priceForCountry(food: Food, country: 'FR' | 'DE'): number {
  return country === 'DE' ? food.priceDE : food.priceFR;
}
