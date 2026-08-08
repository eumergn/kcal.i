import { generateDailyPlan } from './planner';
import { sampleFoodsFR } from './sampleData';
import { UserProfile } from './types';

const profile: UserProfile = {
  ageYears: 30,
  sex: 'male',
  heightCm: 178,
  weightKg: 80,
  country: 'FR',
  activityLevel: 'moderately_active',
  goal: 'cut',
  dietType: 'omnivore',
  allergies: [],
  dislikedFoodIds: [],
  mealsPerDay: 4,
  budgetAmount: 10,
  budgetPeriod: 'daily',
  currency: 'EUR',
};

const plan = generateDailyPlan(profile, sampleFoodsFR);

console.log('=== Daily Targets ===');
console.log(`BMR: ${plan.targets.bmr} kcal | TDEE: ${plan.targets.tdee} kcal`);
console.log(
  `Goal calories: ${plan.targets.calories} kcal | Protein: ${plan.targets.proteinG}g | Carbs: ${plan.targets.carbsG}g | Fat: ${plan.targets.fatG}g | Fiber: ${plan.targets.fiberG}g`,
);
console.log(`Budget: ${plan.budgetForDay} ${plan.currency}\n`);

for (const meal of plan.meals) {
  console.log(`--- ${meal.time} ${meal.name} ---`);
  for (const item of meal.items) {
    console.log(
      `  ${item.food.name}: ${item.grams}g @ ${item.cheapestStore} - ${item.calories} kcal, P${item.proteinG}/C${item.carbsG}/F${item.fatG}g - ${item.cost} ${plan.currency}`,
    );
  }
  console.log(
    `  Meal total: ${meal.calories} kcal, P${meal.proteinG}/C${meal.carbsG}/F${meal.fatG}g, ${meal.cost} ${plan.currency}\n`,
  );
}

console.log('=== Daily Totals ===');
console.log(
  `${plan.totals.calories} / ${plan.targets.calories} kcal | Protein ${plan.totals.proteinG} / ${plan.targets.proteinG}g | Carbs ${plan.totals.carbsG} / ${plan.targets.carbsG}g | Fat ${plan.totals.fatG} / ${plan.targets.fatG}g`,
);
console.log(`Cost: ${plan.totals.cost} / ${plan.budgetForDay} ${plan.currency}`);
