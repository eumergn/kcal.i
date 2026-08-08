import { generateDailyPlan } from './planner';
import { sampleFoodsFR } from './sampleData';
import { UserProfile } from './types';

const profile: UserProfile = {
  ageYears: 26,
  sex: 'female',
  heightCm: 165,
  weightKg: 60,
  country: 'FR',
  activityLevel: 'lightly_active',
  goal: 'maintain',
  dietType: 'vegan',
  allergies: ['gluten'],
  dislikedFoodIds: [],
  mealsPerDay: 3,
  budgetAmount: 3,
  budgetPeriod: 'daily',
  currency: 'EUR',
};

const plan = generateDailyPlan(profile, sampleFoodsFR);

const forbidden = ['chicken-breast', 'eggs', 'greek-yogurt', 'tuna-canned', 'ground-beef', 'cottage-cheese', 'milk', 'bread', 'pasta'];
const usedIds = plan.meals.flatMap((m) => m.items.map((i) => i.food.id));
const violations = usedIds.filter((id) => forbidden.includes(id));

console.log('Used foods:', [...new Set(usedIds)]);
console.log('Constraint violations (should be empty):', violations);
console.log(`Cost: ${plan.totals.cost} / ${plan.budgetForDay} ${plan.currency} (budget ${profile.budgetAmount}/day)`);
console.log(`Calories: ${plan.totals.calories} / ${plan.targets.calories} | Protein: ${plan.totals.proteinG} / ${plan.targets.proteinG}g`);
