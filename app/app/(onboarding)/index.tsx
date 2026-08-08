import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';

import { Text, View } from '@/components/Themed';
import { AuthTextInput } from '@/components/AuthTextInput';
import { ChipSelect } from '@/components/ChipSelect';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile, ActivityLevel, BudgetPeriod, DietType, Goal, Sex } from '@/context/ProfileContext';

const TOTAL_STEPS = 5;

const GOAL_OPTIONS: { value: Goal; label: string; description: string }[] = [
  { value: 'cut', label: 'Cut', description: 'Controlled deficit, high protein' },
  { value: 'bulk', label: 'Bulk', description: 'Moderate surplus for muscle gain' },
  { value: 'maintain', label: 'Maintain', description: 'Hold steady, meet nutrient needs' },
  { value: 'recomposition', label: 'Recomposition', description: 'Build muscle, lose fat, slowly' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little exercise' },
  { value: 'lightly_active', label: 'Lightly active', description: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately active', description: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very active', description: 'Hard exercise 6-7 days/week' },
  { value: 'extremely_active', label: 'Extremely active', description: 'Physical job or 2x/day training' },
];

const DIET_OPTIONS: { value: DietType; label: string; description?: string }[] = [
  { value: 'omnivore', label: 'No preference', description: 'Eat everything, no restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

const ALLERGY_OPTIONS = ['None', 'Peanuts', 'Nuts', 'Dairy', 'Eggs', 'Gluten', 'Shellfish', 'Fish', 'Soy'];
const NONE_ALLERGY = 'None';

type FormState = {
  first_name: string;
  sex: Sex | '';
  age: string;
  height_cm: string;
  weight_kg: string;
  goal: Goal | '';
  activity_level: ActivityLevel | '';
  gym_days_per_week: string;
  country: 'FR' | 'DE' | '';
  budget_amount: string;
  budget_period: BudgetPeriod | '';
  diet_type: DietType | '';
  allergies: string[];
};

const initialForm: FormState = {
  first_name: '',
  sex: '',
  age: '',
  height_cm: '',
  weight_kg: '',
  goal: '',
  activity_level: '',
  gym_days_per_week: '',
  country: '',
  budget_amount: '',
  budget_period: '',
  diet_type: '',
  allergies: [],
};

function stepIsValid(step: number, form: FormState): boolean {
  const positiveNumber = (s: string) => s.trim() !== '' && Number(s) > 0;
  switch (step) {
    case 0:
      return form.first_name.trim() !== '' && form.sex !== '' && positiveNumber(form.age) && positiveNumber(form.height_cm) && positiveNumber(form.weight_kg);
    case 1:
      return form.goal !== '';
    case 2:
      return form.activity_level !== '' && form.gym_days_per_week.trim() !== '' && Number(form.gym_days_per_week) >= 0 && Number(form.gym_days_per_week) <= 7;
    case 3:
      return form.country !== '' && positiveNumber(form.budget_amount) && form.budget_period !== '';
    case 4:
      return form.diet_type !== '';
    default:
      return false;
  }
}

export default function OnboardingScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { createProfile } = useProfile();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleAllergy = (allergy: string) =>
    setForm((f) => {
      if (allergy === NONE_ALLERGY) {
        // Selecting "None" is exclusive - it clears any specific allergies already picked.
        return { ...f, allergies: f.allergies.includes(NONE_ALLERGY) ? [] : [NONE_ALLERGY] };
      }
      // Selecting any specific allergy cancels "None", since they're contradictory.
      const withoutNone = f.allergies.filter((a) => a !== NONE_ALLERGY);
      const allergies = withoutNone.includes(allergy) ? withoutNone.filter((a) => a !== allergy) : [...withoutNone, allergy];
      return { ...f, allergies };
    });

  const isLastStep = step === TOTAL_STEPS - 1;
  const canProceed = stepIsValid(step, form);

  const handleNext = async () => {
    if (!canProceed) return;
    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: submitError } = await createProfile({
      first_name: form.first_name.trim(),
      sex: form.sex as Sex,
      age: Number(form.age),
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      goal: form.goal as Goal,
      activity_level: form.activity_level as ActivityLevel,
      gym_days_per_week: Number(form.gym_days_per_week),
      country: form.country as 'FR' | 'DE',
      budget_amount: Number(form.budget_amount),
      budget_period: form.budget_period as BudgetPeriod,
      diet_type: form.diet_type as DietType,
      allergies: form.allergies.filter((a) => a !== NONE_ALLERGY), // "None" is a UI convenience, not a real allergen
    });
    setSubmitting(false);
    if (submitError) setError(submitError);
    // On success, ProfileContext's status flips to "present" and the root layout's
    // Stack.Protected guard automatically swaps to the main app - no navigation call needed.
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <View style={styles.progressRow} lightColor="transparent" darkColor="transparent">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <RNView
              key={i}
              style={[styles.progressDot, { backgroundColor: i <= step ? c.ringCalories : c.cardDivider, flex: 1 }]}
            />
          ))}
        </View>
        <Text style={[styles.stepLabel, { color: c.secondaryText }]}>STEP {step + 1} OF {TOTAL_STEPS}</Text>

        {step === 0 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>Tell us about you</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <AuthTextInput placeholder="What should we call you?" value={form.first_name} onChangeText={(t) => update('first_name', t)} />
              <ChipSelect
                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Prefer not to say' }]}
                selected={form.sex ? [form.sex] : []}
                onToggle={(v) => update('sex', v as Sex)}
              />
              <AuthTextInput placeholder="Age" keyboardType="number-pad" value={form.age} onChangeText={(t) => update('age', t)} />
              <AuthTextInput placeholder="Height (cm)" keyboardType="number-pad" value={form.height_cm} onChangeText={(t) => update('height_cm', t)} />
              <AuthTextInput placeholder="Weight (kg)" keyboardType="number-pad" value={form.weight_kg} onChangeText={(t) => update('weight_kg', t)} />
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>What&apos;s your goal?</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <ChipSelect options={GOAL_OPTIONS} selected={form.goal ? [form.goal] : []} onToggle={(v) => update('goal', v as Goal)} />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>How active are you?</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <ChipSelect
                options={ACTIVITY_OPTIONS}
                selected={form.activity_level ? [form.activity_level] : []}
                onToggle={(v) => update('activity_level', v as ActivityLevel)}
              />
              <AuthTextInput
                placeholder="Gym days per week (0-7)"
                keyboardType="number-pad"
                value={form.gym_days_per_week}
                onChangeText={(t) => update('gym_days_per_week', t)}
              />
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>Country &amp; budget</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <ChipSelect
                options={[{ value: 'FR', label: 'France' }, { value: 'DE', label: 'Germany' }]}
                selected={form.country ? [form.country] : []}
                onToggle={(v) => update('country', v as 'FR' | 'DE')}
              />
              <AuthTextInput
                placeholder="Food budget amount"
                keyboardType="decimal-pad"
                value={form.budget_amount}
                onChangeText={(t) => update('budget_amount', t)}
              />
              <ChipSelect
                options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
                selected={form.budget_period ? [form.budget_period] : []}
                onToggle={(v) => update('budget_period', v as BudgetPeriod)}
              />
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>Diet &amp; allergies</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <ChipSelect options={DIET_OPTIONS} selected={form.diet_type ? [form.diet_type] : []} onToggle={(v) => update('diet_type', v as DietType)} />
              <Text style={[styles.sublabel, { color: c.secondaryText }]}>Allergies (optional)</Text>
              <ChipSelect options={ALLERGY_OPTIONS.map((a) => ({ value: a, label: a }))} selected={form.allergies} onToggle={toggleAllergy} />
            </View>
          </>
        )}

        {error && <Text style={[styles.errorText, { color: c.ringProtein }]}>{error}</Text>}

        <View style={styles.navRow} lightColor="transparent" darkColor="transparent">
          {step > 0 && (
            <Pressable onPress={() => setStep((s) => s - 1)} style={[styles.backButton, { backgroundColor: c.cardDivider }]}>
              <Text style={[styles.backButtonText, { color: c.text }]}>Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleNext}
            disabled={!canProceed || submitting}
            style={[styles.nextButton, { backgroundColor: c.ringCalories, opacity: !canProceed || submitting ? 0.5 : 1 }]}
          >
            {submitting ? <ActivityIndicator color="#04110D" /> : <Text style={styles.nextButtonText}>{isLastStep ? 'Create my plan' : 'Next'}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48, flexGrow: 1 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  progressDot: { height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 24 },
  sublabel: { fontSize: 13, fontWeight: '700', marginTop: 4, marginBottom: -2 },
  form: { gap: 14 },
  errorText: { fontSize: 13, fontWeight: '600', marginTop: 16 },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  backButton: { borderRadius: 14, paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center' },
  backButtonText: { fontSize: 15, fontWeight: '700' },
  nextButton: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextButtonText: { fontSize: 15, fontWeight: '700', color: '#04110D' },
});
