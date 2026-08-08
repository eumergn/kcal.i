import { FoodWithPrices } from './types';

/**
 * Illustrative placeholder prices for FR stores - NOT curated real retail data.
 * Stand-in for the manually-curated food_price table described in the project README,
 * used here only to exercise the planner and eyeball output quality.
 */
export const sampleFoodsFR: FoodWithPrices[] = [
  {
    id: 'chicken-breast', name: 'Chicken breast', category: 'chicken',
    caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0,
    dietCompatible: ['omnivore', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Leclerc', pricePer100: 1.10 },
      { storeName: 'Carrefour', pricePer100: 1.25 },
      { storeName: 'Lidl', pricePer100: 0.95 },
      { storeName: 'Intermarché', pricePer100: 1.05 },
    ],
  },
  {
    id: 'eggs', name: 'Eggs', category: 'eggs',
    caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1.1, fatPer100: 11, fiberPer100: 0,
    dietCompatible: ['omnivore', 'vegetarian', 'pescatarian'], allergens: ['egg'],
    prices: [
      { storeName: 'Leclerc', pricePer100: 0.35 },
      { storeName: 'Lidl', pricePer100: 0.28 },
      { storeName: 'Carrefour', pricePer100: 0.38 },
      { storeName: 'Auchan', pricePer100: 0.33 },
    ],
  },
  {
    id: 'greek-yogurt', name: 'Greek yogurt (plain)', category: 'dairy',
    caloriesPer100: 59, proteinPer100: 10, carbsPer100: 3.6, fatPer100: 0.4, fiberPer100: 0,
    dietCompatible: ['omnivore', 'vegetarian', 'pescatarian'], allergens: ['dairy'],
    prices: [
      { storeName: 'Lidl', pricePer100: 0.30 },
      { storeName: 'Carrefour', pricePer100: 0.42 },
      { storeName: 'Leclerc', pricePer100: 0.38 },
    ],
  },
  {
    id: 'tuna-canned', name: 'Canned tuna (in water)', category: 'fish',
    caloriesPer100: 116, proteinPer100: 26, carbsPer100: 0, fatPer100: 1, fiberPer100: 0,
    dietCompatible: ['omnivore', 'pescatarian'], allergens: ['fish'],
    prices: [
      { storeName: 'Leclerc', pricePer100: 1.40 },
      { storeName: 'Intermarché', pricePer100: 1.35 },
      { storeName: 'Lidl', pricePer100: 1.10 },
    ],
  },
  {
    id: 'ground-beef', name: 'Ground beef (5% fat)', category: 'beef',
    caloriesPer100: 137, proteinPer100: 21, carbsPer100: 0, fatPer100: 5, fiberPer100: 0,
    dietCompatible: ['omnivore'], allergens: [],
    prices: [
      { storeName: 'Carrefour', pricePer100: 1.60 },
      { storeName: 'Leclerc', pricePer100: 1.50 },
      { storeName: 'Intermarché', pricePer100: 1.55 },
    ],
  },
  {
    id: 'cottage-cheese', name: 'Cottage cheese', category: 'dairy',
    caloriesPer100: 98, proteinPer100: 11, carbsPer100: 3.4, fatPer100: 4.3, fiberPer100: 0,
    dietCompatible: ['omnivore', 'vegetarian', 'pescatarian'], allergens: ['dairy'],
    prices: [
      { storeName: 'Carrefour', pricePer100: 0.60 },
      { storeName: 'Auchan', pricePer100: 0.55 },
    ],
  },
  {
    id: 'tofu', name: 'Firm tofu', category: 'protein_product',
    caloriesPer100: 144, proteinPer100: 15, carbsPer100: 3, fatPer100: 8, fiberPer100: 1.2,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'], allergens: ['soy'],
    prices: [
      { storeName: 'Carrefour', pricePer100: 0.90 },
      { storeName: 'Auchan', pricePer100: 0.85 },
      { storeName: 'Lidl', pricePer100: 0.70 },
    ],
  },
  {
    id: 'lentils', name: 'Lentils (cooked)', category: 'lentils',
    caloriesPer100: 116, proteinPer100: 9, carbsPer100: 20, fatPer100: 0.4, fiberPer100: 7.9,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Leclerc', pricePer100: 0.25 },
      { storeName: 'Lidl', pricePer100: 0.18 },
      { storeName: 'Intermarché', pricePer100: 0.22 },
    ],
  },
  {
    id: 'chickpeas', name: 'Chickpeas (cooked)', category: 'beans',
    caloriesPer100: 164, proteinPer100: 9, carbsPer100: 27, fatPer100: 2.6, fiberPer100: 7.6,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Leclerc', pricePer100: 0.24 },
      { storeName: 'Lidl', pricePer100: 0.17 },
      { storeName: 'Carrefour', pricePer100: 0.28 },
    ],
  },
  {
    id: 'rice', name: 'White rice (cooked)', category: 'rice',
    caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Leclerc', pricePer100: 0.15 },
      { storeName: 'Lidl', pricePer100: 0.10 },
      { storeName: 'Auchan', pricePer100: 0.13 },
    ],
  },
  {
    id: 'oats', name: 'Oats (dry)', category: 'oats',
    caloriesPer100: 389, proteinPer100: 17, carbsPer100: 66, fatPer100: 7, fiberPer100: 10.6,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: ['gluten'],
    prices: [
      { storeName: 'Lidl', pricePer100: 0.28 },
      { storeName: 'Carrefour', pricePer100: 0.35 },
      { storeName: 'Leclerc', pricePer100: 0.32 },
    ],
  },
  {
    id: 'potatoes', name: 'Potatoes (boiled)', category: 'potatoes',
    caloriesPer100: 87, proteinPer100: 1.9, carbsPer100: 20, fatPer100: 0.1, fiberPer100: 1.8,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Intermarché', pricePer100: 0.12 },
      { storeName: 'Leclerc', pricePer100: 0.14 },
      { storeName: 'Lidl', pricePer100: 0.10 },
    ],
  },
  {
    id: 'pasta', name: 'Whole wheat pasta (cooked)', category: 'pasta',
    caloriesPer100: 124, proteinPer100: 5, carbsPer100: 25, fatPer100: 1.1, fiberPer100: 3.5,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'], allergens: ['gluten'],
    prices: [
      { storeName: 'Leclerc', pricePer100: 0.20 },
      { storeName: 'Lidl', pricePer100: 0.15 },
      { storeName: 'Carrefour', pricePer100: 0.22 },
    ],
  },
  {
    id: 'bread', name: 'Whole grain bread', category: 'bread',
    caloriesPer100: 247, proteinPer100: 13, carbsPer100: 41, fatPer100: 4.2, fiberPer100: 7,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian'], allergens: ['gluten'],
    prices: [
      { storeName: 'Carrefour', pricePer100: 0.45 },
      { storeName: 'Lidl', pricePer100: 0.35 },
      { storeName: 'Auchan', pricePer100: 0.40 },
    ],
  },
  {
    id: 'banana', name: 'Banana', category: 'fruits',
    caloriesPer100: 89, proteinPer100: 1.1, carbsPer100: 23, fatPer100: 0.3, fiberPer100: 2.6,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Lidl', pricePer100: 0.18 },
      { storeName: 'Leclerc', pricePer100: 0.20 },
      { storeName: 'Intermarché', pricePer100: 0.19 },
    ],
  },
  {
    id: 'apple', name: 'Apple', category: 'fruits',
    caloriesPer100: 52, proteinPer100: 0.3, carbsPer100: 14, fatPer100: 0.2, fiberPer100: 2.4,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Leclerc', pricePer100: 0.25 },
      { storeName: 'Lidl', pricePer100: 0.20 },
      { storeName: 'Auchan', pricePer100: 0.22 },
    ],
  },
  {
    id: 'frozen-veg', name: 'Frozen mixed vegetables', category: 'vegetables',
    caloriesPer100: 65, proteinPer100: 3, carbsPer100: 13, fatPer100: 0.5, fiberPer100: 4,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Lidl', pricePer100: 0.15 },
      { storeName: 'Carrefour', pricePer100: 0.20 },
      { storeName: 'Leclerc', pricePer100: 0.18 },
    ],
  },
  {
    id: 'carrots', name: 'Carrots', category: 'vegetables',
    caloriesPer100: 41, proteinPer100: 0.9, carbsPer100: 10, fatPer100: 0.2, fiberPer100: 2.8,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Intermarché', pricePer100: 0.10 },
      { storeName: 'Lidl', pricePer100: 0.08 },
      { storeName: 'Leclerc', pricePer100: 0.12 },
    ],
  },
  {
    id: 'spinach', name: 'Spinach', category: 'vegetables',
    caloriesPer100: 23, proteinPer100: 2.9, carbsPer100: 3.6, fatPer100: 0.4, fiberPer100: 2.2,
    dietCompatible: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher'], allergens: [],
    prices: [
      { storeName: 'Carrefour', pricePer100: 0.35 },
      { storeName: 'Auchan', pricePer100: 0.30 },
    ],
  },
  {
    id: 'milk', name: 'Milk (semi-skimmed)', category: 'dairy',
    caloriesPer100: 46, proteinPer100: 3.4, carbsPer100: 4.8, fatPer100: 1.6, fiberPer100: 0,
    dietCompatible: ['omnivore', 'vegetarian', 'pescatarian'], allergens: ['dairy'],
    prices: [
      { storeName: 'Lidl', pricePer100: 0.09 },
      { storeName: 'Leclerc', pricePer100: 0.11 },
      { storeName: 'Carrefour', pricePer100: 0.10 },
    ],
  },
];
