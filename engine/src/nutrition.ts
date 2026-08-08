import { ActivityLevel, Goal, NutritionTargets, UserProfile } from './types';

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

// Moderate, non-aggressive adjustments per spec section 10/27 - no extreme deficits/surpluses.
const GOAL_CALORIE_MULTIPLIER: Record<Goal, number> = {
  cut: 0.8,
  maintain: 1.0,
  bulk: 1.1,
  recomposition: 0.95,
  performance: 1.05,
};

// g of protein per kg bodyweight, by goal
const GOAL_PROTEIN_PER_KG: Record<Goal, number> = {
  cut: 2.2,
  recomposition: 2.2,
  performance: 2.0,
  maintain: 1.8,
  bulk: 1.8,
};

const FAT_PERCENT_OF_CALORIES = 0.25;
const FIBER_PER_1000_KCAL = 14;

// Absolute safety floors - never recommend below these regardless of goal/deficit,
// per spec section 27 ("do not generate dangerously low calorie targets").
const MIN_CALORIES: Record<'male' | 'female', number> = { male: 1500, female: 1200 };

export function calculateBmr(profile: UserProfile): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears;
  return profile.sex === 'male' ? base + 5 : base - 161;
}

export function calculateTargets(profile: UserProfile): NutritionTargets {
  const bmr = calculateBmr(profile);
  const tdee = bmr * ACTIVITY_MULTIPLIER[profile.activityLevel];

  let calories = tdee * GOAL_CALORIE_MULTIPLIER[profile.goal];
  const floor = MIN_CALORIES[profile.sex];
  if (calories < floor) calories = floor;

  const proteinG = profile.weightKg * GOAL_PROTEIN_PER_KG[profile.goal];
  const proteinKcal = proteinG * 4;

  const fatKcal = calories * FAT_PERCENT_OF_CALORIES;
  const fatG = fatKcal / 9;

  const remainingKcal = Math.max(calories - proteinKcal - fatKcal, 0);
  const carbsG = remainingKcal / 4;

  const fiberG = (calories / 1000) * FIBER_PER_1000_KCAL;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
    fiberG: Math.round(fiberG),
  };
}

export function dailyBudget(profile: UserProfile): number {
  switch (profile.budgetPeriod) {
    case 'daily':
      return profile.budgetAmount;
    case 'weekly':
      return profile.budgetAmount / 7;
    case 'monthly':
      return profile.budgetAmount / 30;
  }
}
