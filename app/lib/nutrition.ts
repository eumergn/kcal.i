import { ActivityLevel, Goal, Sex } from '@/context/ProfileContext';

export type NutritionInput = {
  sex: Sex | '';
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel | '';
  goal: Goal | '';
  gym_days_per_week: number;
};

export type NutritionTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterLiters: number;
};

/**
 * Mifflin-St Jeor BMR - the current gold standard for general populations (~5% average
 * error vs the older Harris-Benedict's 10-15%); Katch-McArdle can beat it but needs a
 * body-fat % reading this app doesn't collect, so it's not a fair swap here.
 *
 * TDEE splits lifestyle activity (WHO/FAO/UNU standard PAL multipliers) from dedicated
 * training days, instead of folding "how many times a week you train" into the same
 * bucket as "how active your day job is" - gym_days_per_week adds real MET-based
 * exercise energy on top (Compendium of Physical Activities: general resistance
 * training ~5.0 MET, ~60 min/session, kcal = minutes * (MET * 3.5 * kg / 200)).
 *
 * Goal calorie targets use moderate, sustainable rates rather than aggressive crash
 * percentages. Protein follows the ISSN position stand on protein and exercise (higher
 * during a cut specifically to preserve lean mass in a deficit). Fat is held at the
 * ISSN/ACSM 20-35% of calories band with a hard 0.6 g/kg floor for hormonal health
 * regardless of how large the deficit is. Carbs fill whatever calories remain.
 *
 * Water intake follows the common ACSM-aligned 30-35 ml/kg baseline plus fluid
 * replacement for training days (~550 ml/hour of moderate exercise, amortized across
 * the week) plus a modest allowance for general daily activity level.
 *
 * Shared between onboarding's live results preview and every screen that needs the
 * real user's targets (Home, Track, StreakBadge, ...) - it's a pure function of
 * profile fields already stored in Supabase, so there's no need to persist the
 * computed output anywhere; every caller just recomputes it from `profile`.
 */
export function computeTargets(input: NutritionInput): NutritionTargets {
  const { sex, age, height_cm, weight_kg, activity_level, goal, gym_days_per_week } = input;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  const bmr = sex === 'male' ? base + 5 : sex === 'female' ? base - 161 : base - 78;

  const activityMultiplier: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  const lifestyleTDEE = bmr * (activity_level ? activityMultiplier[activity_level] : 1.375);

  const perSessionKcal = weight_kg * 5.25; // 60 min * (5.0 MET * 3.5 * kg / 200)
  const trainingKcalPerDay = (gym_days_per_week * perSessionKcal) / 7;
  const tdee = lifestyleTDEE + trainingKcalPerDay;

  const goalMultiplier: Record<Goal, number> = { cut: 0.8, bulk: 1.12, maintain: 1, recomposition: 0.93 };
  const calories = Math.round(tdee * (goal ? goalMultiplier[goal] : 1));

  const proteinPerKg: Record<Goal, number> = { cut: 2.4, bulk: 1.8, maintain: 1.8, recomposition: 2.2 };
  const proteinG = Math.round(weight_kg * (goal ? proteinPerKg[goal] : 1.8));

  const fatFromCalories = (calories * 0.25) / 9;
  const fatFloor = weight_kg * 0.6;
  const fatG = Math.round(Math.max(fatFromCalories, fatFloor));

  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  const activityWaterBonusMl: Record<ActivityLevel, number> = {
    sedentary: 0,
    lightly_active: 150,
    moderately_active: 250,
    very_active: 400,
    extremely_active: 550,
  };
  const trainingWaterMl = (gym_days_per_week * 550) / 7;
  const waterMl = weight_kg * 33 + trainingWaterMl + (activity_level ? activityWaterBonusMl[activity_level] : 150);
  const waterLiters = Math.min(5, Math.max(1.5, Math.round((waterMl / 1000) * 10) / 10));

  return { calories: Math.max(calories, 1200), proteinG, carbsG, fatG, waterLiters };
}
