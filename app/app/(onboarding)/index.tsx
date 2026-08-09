import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text, View } from '@/components/Themed';
import { AuthTextInput } from '@/components/AuthTextInput';
import { ChipSelect } from '@/components/ChipSelect';
import { OptionCard } from '@/components/OptionCard';
import { RulerPicker } from '@/components/RulerPicker';
import { Logo } from '@/components/Logo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile, ActivityLevel, BudgetPeriod, DietType, Goal, Sex } from '@/context/ProfileContext';
import { useWeight } from '@/context/WeightContext';
import { useSettings } from '@/context/SettingsContext';
import { computeTargets } from '@/lib/nutrition';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Data-collecting steps only (1-10) get a segment in the progress bar - the welcome
 * screen (0) and the two reveal screens (11, 12) don't count against it. */
const TOTAL_DATA_STEPS = 10;
const LAST_STEP = 12;

type GymExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert';

type FormState = {
  first_name: string;
  sex: Sex | '';
  age: number;
  height_cm: number;
  weight_kg: number;
  goal_weight_kg: number;
  activity_level: ActivityLevel | '';
  gym_experience: GymExperience | '';
  gym_days_per_week: number;
  goal: Goal | '';
  country: 'FR' | 'DE' | '';
  budget_amount: number;
  budget_period: BudgetPeriod | '';
  diet_type: DietType | '';
  allergies: string[];
};

const initialForm: FormState = {
  first_name: '',
  sex: '',
  age: 25,
  height_cm: 175,
  weight_kg: 70,
  goal_weight_kg: 70,
  activity_level: '',
  gym_experience: '',
  gym_days_per_week: 3,
  goal: '',
  country: '',
  budget_amount: 150,
  budget_period: '',
  diet_type: '',
  allergies: [],
};

const NONE_ALLERGY = 'None';
const ALLERGY_OPTIONS = ['None', 'Peanuts', 'Nuts', 'Dairy', 'Eggs', 'Gluten', 'Shellfish', 'Fish', 'Soy'];

function stepIsValid(step: number, form: FormState): boolean {
  switch (step) {
    case 1:
      return form.first_name.trim() !== '' && form.sex !== '';
    case 6:
      return form.activity_level !== '';
    case 7:
      return form.gym_experience !== '';
    case 8:
      return form.goal !== '';
    case 9:
      return form.country !== '' && form.budget_amount > 0 && form.budget_period !== '';
    case 10:
      return form.diet_type !== '';
    default:
      return true; // welcome + the three ruler steps (always have a value) + the two reveal steps
  }
}

/** A small burst of accent-colored dots behind the result icon - the one celebratory,
 * memorable beat in an otherwise businesslike form (peak-end rule). */
function ConfettiBurst({ colors }: { colors: (typeof Colors)['light'] }) {
  const dots = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      anim: new Animated.Value(0),
      angle: (i / 12) * Math.PI * 2,
      distance: 65 + ((i * 37) % 30),
      color: [colors.ringCalories, colors.ringProtein, colors.ringCarbs, colors.ringFat][i % 4],
      size: 6 + (i % 3) * 2,
    })),
  ).current;

  useEffect(() => {
    Animated.stagger(
      28,
      dots.map((d) => Animated.timing(d.anim, { toValue: 1, duration: 750, easing: EASE_OUT, useNativeDriver: true })),
    ).start();
  }, [dots]);

  return (
    <RNView pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {dots.map((d, i) => {
        const translateX = d.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(d.angle) * d.distance] });
        const translateY = d.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(d.angle) * d.distance] });
        const opacity = d.anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });
        const scale = d.anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              backgroundColor: d.color,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
    </RNView>
  );
}

function Stepper({ value, onChange, min, max, colors }: { value: number; onChange: (v: number) => void; min: number; max: number; colors: (typeof Colors)['light'] }) {
  return (
    <RNView style={styles.stepperRow}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={[styles.stepperButton, { backgroundColor: colors.cardDivider, opacity: value <= min ? 0.4 : 1 }]}
      >
        <FontAwesome name="minus" size={14} color={colors.text} />
      </Pressable>
      <Text style={[styles.stepperValue, { color: colors.text }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={[styles.stepperButton, { backgroundColor: colors.cardDivider, opacity: value >= max ? 0.4 : 1 }]}
      >
        <FontAwesome name="plus" size={14} color={colors.text} />
      </Pressable>
    </RNView>
  );
}

export default function OnboardingScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { createProfile } = useProfile();
  const { seedFromOnboarding } = useWeight();
  const { setWaterGoalLiters } = useSettings();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleAllergy = (allergy: string) =>
    setForm((f) => {
      if (allergy === NONE_ALLERGY) {
        return { ...f, allergies: f.allergies.includes(NONE_ALLERGY) ? [] : [NONE_ALLERGY] };
      }
      const withoutNone = f.allergies.filter((a) => a !== NONE_ALLERGY);
      const allergies = withoutNone.includes(allergy) ? withoutNone.filter((a) => a !== allergy) : [...withoutNone, allergy];
      return { ...f, allergies };
    });

  const goToStep = (next: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setStep(next);
  };

  const canProceed = stepIsValid(step, form);
  const targets = useMemo(
    () => computeTargets(form),
    [form.sex, form.age, form.height_cm, form.weight_kg, form.activity_level, form.goal, form.gym_days_per_week],
  );

  const handleNext = async () => {
    if (!canProceed || submitting) return;
    if (step < LAST_STEP) {
      goToStep(step + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: submitError } = await createProfile({
      first_name: form.first_name.trim(),
      sex: form.sex as Sex,
      age: form.age,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      goal: form.goal as Goal,
      activity_level: form.activity_level as ActivityLevel,
      gym_days_per_week: form.gym_days_per_week,
      country: form.country as 'FR' | 'DE',
      budget_amount: form.budget_amount,
      budget_period: form.budget_period as BudgetPeriod,
      diet_type: form.diet_type as DietType,
      allergies: form.allergies.filter((a) => a !== NONE_ALLERGY),
    });
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    seedFromOnboarding(form.weight_kg, form.goal_weight_kg);
    setWaterGoalLiters(targets.waterLiters);
  };

  const progressFilled = Math.min(Math.max(step, 0), TOTAL_DATA_STEPS);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
      >
        {step > 0 && (
          <>
            <RNView style={styles.headerRow}>
              <Pressable onPress={() => goToStep(step - 1)} hitSlop={14} accessibilityLabel="Back">
                <FontAwesome name="chevron-left" size={16} color={c.text} />
              </Pressable>
              <RNView style={styles.progressRow}>
                {Array.from({ length: TOTAL_DATA_STEPS }).map((_, i) => (
                  <RNView key={i} style={[styles.progressDot, { backgroundColor: i < progressFilled ? c.text : c.cardDivider }]} />
                ))}
              </RNView>
            </RNView>
          </>
        )}

        {step === 0 && (
          <View style={styles.welcomeWrap} lightColor="transparent" darkColor="transparent">
            <Logo layout="stacked" size="large" />
            <Text style={[styles.welcomeTitle, { color: c.text }]}>Calorie tracking{'\n'}made easy</Text>
            <Text style={[styles.welcomeSubtitle, { color: c.secondaryText }]}>
              Scan meals, track calories, and shop on a real budget with a plan built around you.
            </Text>
          </View>
        )}

        {step === 1 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>Let&apos;s get to know you better</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>This helps us personalize your plan and recommendations.</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <Text style={[styles.sublabel, { color: c.text, marginTop: 0 }]}>What should we call you?</Text>
              <AuthTextInput
                placeholder="Your name"
                value={form.first_name}
                onChangeText={(t) => update('first_name', t)}
                style={[styles.nameInput, { borderColor: c.text }]}
              />
              <Text style={[styles.sublabel, { color: c.text, marginTop: 20 }]}>Gender</Text>
              <OptionCard
                icon={<FontAwesome5 name="mars" size={18} color={c.text} />}
                label="Male"
                selected={form.sex === 'male'}
                onPress={() => update('sex', 'male')}
                colors={c}
              />
              <OptionCard
                icon={<FontAwesome5 name="venus" size={18} color={c.text} />}
                label="Female"
                selected={form.sex === 'female'}
                onPress={() => update('sex', 'female')}
                colors={c}
              />
              <OptionCard
                icon={<FontAwesome5 name="venus-mars" size={18} color={c.text} />}
                label="Prefer not to say"
                selected={form.sex === 'other'}
                onPress={() => update('sex', 'other')}
                colors={c}
              />
              {form.first_name.trim() === '' && (
                <Text style={[styles.hintText, { color: c.secondaryText }]}>Enter your name above to continue.</Text>
              )}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>What&apos;s your age?</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>We&apos;ll use this to calculate your calorie needs.</Text>
            <RulerPicker value={form.age} onChange={(v) => update('age', v)} min={14} max={80} unit="yrs" colors={c} />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>What&apos;s your height?</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>We&apos;ll use this to calculate your calorie needs.</Text>
            <RulerPicker value={form.height_cm} onChange={(v) => update('height_cm', v)} min={140} max={220} unit="cm" colors={c} />
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>What&apos;s your current weight?</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>This helps us understand your starting point.</Text>
            <RulerPicker
              value={form.weight_kg}
              onChange={(v) => update('weight_kg', v)}
              min={40}
              max={160}
              step={0.5}
              majorEvery={2}
              decimals={1}
              orientation="horizontal"
              unit="kg"
              colors={c}
            />
          </>
        )}

        {step === 5 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>What&apos;s your goal weight?</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>Where do you want to be?</Text>
            <RulerPicker
              value={form.goal_weight_kg}
              onChange={(v) => update('goal_weight_kg', v)}
              min={40}
              max={160}
              step={0.5}
              majorEvery={2}
              decimals={1}
              orientation="horizontal"
              unit="kg"
              colors={c}
            />
          </>
        )}

        {step === 6 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>How active are you during the day?</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>This helps us estimate your daily calorie needs.</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <OptionCard icon={<FontAwesome5 name="couch" size={18} color={c.text} />} label="Sedentary" description="Little or no exercise" selected={form.activity_level === 'sedentary'} onPress={() => update('activity_level', 'sedentary')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="walking" size={18} color={c.text} />} label="Lightly active" description="1-3 days per week" selected={form.activity_level === 'lightly_active'} onPress={() => update('activity_level', 'lightly_active')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="dumbbell" size={18} color={c.text} />} label="Moderately active" description="3-5 days per week" selected={form.activity_level === 'moderately_active'} onPress={() => update('activity_level', 'moderately_active')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="running" size={18} color={c.text} />} label="Very active" description="6-7 days per week" selected={form.activity_level === 'very_active'} onPress={() => update('activity_level', 'very_active')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="bolt" size={18} color={c.text} />} label="Extra active" description="Very intense daily activity or physical job" selected={form.activity_level === 'extremely_active'} onPress={() => update('activity_level', 'extremely_active')} colors={c} />
            </View>
          </>
        )}

        {step === 7 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>What&apos;s your gym experience?</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>This helps us tailor your plan to you.</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <OptionCard icon={<FontAwesome5 name="seedling" size={18} color={c.text} />} label="Beginner" description="New to training" selected={form.gym_experience === 'beginner'} onPress={() => update('gym_experience', 'beginner')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="dumbbell" size={18} color={c.text} />} label="Intermediate" description="Have some experience" selected={form.gym_experience === 'intermediate'} onPress={() => update('gym_experience', 'intermediate')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="medal" size={18} color={c.text} />} label="Advanced" description="Trained consistently" selected={form.gym_experience === 'advanced'} onPress={() => update('gym_experience', 'advanced')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="trophy" size={18} color={c.text} />} label="Expert" description="Years of experience" selected={form.gym_experience === 'expert'} onPress={() => update('gym_experience', 'expert')} colors={c} />
              <Text style={[styles.sublabel, { color: c.secondaryText }]}>Gym days per week</Text>
              <Stepper value={form.gym_days_per_week} onChange={(v) => update('gym_days_per_week', v)} min={0} max={7} colors={c} />
            </View>
          </>
        )}

        {step === 8 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>What&apos;s your main goal?</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>We&apos;ll build your plan around this.</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <OptionCard icon={<FontAwesome5 name="fire" size={18} color={c.text} />} label="Lose Weight" description="Controlled deficit, preserve muscle" selected={form.goal === 'cut'} onPress={() => update('goal', 'cut')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="weight-hanging" size={18} color={c.text} />} label="Gain Weight" description="Moderate surplus to build size" selected={form.goal === 'bulk'} onPress={() => update('goal', 'bulk')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="exchange-alt" size={18} color={c.text} />} label="Body Recomposition" description="Build muscle, lose fat, slowly" selected={form.goal === 'recomposition'} onPress={() => update('goal', 'recomposition')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="heart" size={18} color={c.text} />} label="Stay Fit &amp; Healthy" description="Hold steady, meet nutrient needs" selected={form.goal === 'maintain'} onPress={() => update('goal', 'maintain')} colors={c} />
            </View>
          </>
        )}

        {step === 9 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>Country &amp; budget</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>We shop your local market to build a plan that fits.</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <OptionCard icon={<FontAwesome5 name="globe-europe" size={18} color={c.text} />} label="France" selected={form.country === 'FR'} onPress={() => update('country', 'FR')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="globe-europe" size={18} color={c.text} />} label="Germany" selected={form.country === 'DE'} onPress={() => update('country', 'DE')} colors={c} />
              <Text style={[styles.sublabel, { color: c.secondaryText }]}>Food budget amount (EUR)</Text>
              <AuthTextInput
                placeholder="e.g. 150"
                keyboardType="decimal-pad"
                value={form.budget_amount ? String(form.budget_amount) : ''}
                onChangeText={(t) => update('budget_amount', parseFloat(t.replace(',', '.')) || 0)}
              />
              <ChipSelect
                options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
                selected={form.budget_period ? [form.budget_period] : []}
                onToggle={(v) => update('budget_period', v as BudgetPeriod)}
              />
            </View>
          </>
        )}

        {step === 10 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>Diet &amp; allergies</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>So we never suggest something you can&apos;t eat.</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <OptionCard icon={<FontAwesome5 name="utensils" size={18} color={c.text} />} label="No preference" description="Eat everything, no restrictions" selected={form.diet_type === 'omnivore'} onPress={() => update('diet_type', 'omnivore')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="leaf" size={18} color={c.text} />} label="Vegetarian" selected={form.diet_type === 'vegetarian'} onPress={() => update('diet_type', 'vegetarian')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="seedling" size={18} color={c.text} />} label="Vegan" selected={form.diet_type === 'vegan'} onPress={() => update('diet_type', 'vegan')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="fish" size={18} color={c.text} />} label="Pescatarian" selected={form.diet_type === 'pescatarian'} onPress={() => update('diet_type', 'pescatarian')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="moon" size={18} color={c.text} />} label="Halal" selected={form.diet_type === 'halal'} onPress={() => update('diet_type', 'halal')} colors={c} />
              <OptionCard icon={<FontAwesome5 name="star-of-david" size={18} color={c.text} />} label="Kosher" selected={form.diet_type === 'kosher'} onPress={() => update('diet_type', 'kosher')} colors={c} />
              <Text style={[styles.sublabel, { color: c.secondaryText }]}>Allergies (optional)</Text>
              <ChipSelect options={ALLERGY_OPTIONS.map((a) => ({ value: a, label: a }))} selected={form.allergies} onToggle={toggleAllergy} />
            </View>
          </>
        )}

        {step === 11 && (
          <View style={styles.welcomeWrap} lightColor="transparent" darkColor="transparent">
            <RNView style={[styles.resultIconWrap, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
              <ConfettiBurst colors={c} />
              <FontAwesome5 name="fire" size={40} color={c.ringCalories} />
            </RNView>
            <Text style={[styles.title, { color: c.text, textAlign: 'center', marginTop: 24 }]}>Your daily calorie target</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText, textAlign: 'center' }]}>
              Based on your info, here&apos;s your personalized target to reach your goal.
            </Text>
            <Text style={styles.resultValue}>
              <Text style={{ color: c.text }}>{targets.calories.toLocaleString()}</Text>
            </Text>
            <Text style={[styles.resultUnit, { color: c.secondaryText }]}>Calories / day</Text>
            <View style={styles.macroRow} lightColor="transparent" darkColor="transparent">
              <View style={[styles.macroChip, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
                <MaterialCommunityIcons name="food-drumstick" size={17} color={c.ringProtein} />
                <Text style={[styles.macroValue, { color: c.text }]}>{targets.proteinG}g</Text>
                <Text style={[styles.macroLabel, { color: c.secondaryText }]}>Protein</Text>
              </View>
              <View style={[styles.macroChip, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
                <FontAwesome5 name="bread-slice" size={16} color={c.ringCarbs} />
                <Text style={[styles.macroValue, { color: c.text }]}>{targets.carbsG}g</Text>
                <Text style={[styles.macroLabel, { color: c.secondaryText }]}>Carbs</Text>
              </View>
              <View style={[styles.macroChip, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
                <FontAwesome5 name="tint" size={16} color={c.ringFat} />
                <Text style={[styles.macroValue, { color: c.text }]}>{targets.fatG}g</Text>
                <Text style={[styles.macroLabel, { color: c.secondaryText }]}>Fat</Text>
              </View>
              <View style={[styles.macroChip, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
                <FontAwesome5 name="tint" size={16} color={c.ringCarbs} />
                <Text style={[styles.macroValue, { color: c.text }]}>{targets.waterLiters.toFixed(1)}L</Text>
                <Text style={[styles.macroLabel, { color: c.secondaryText }]}>Water</Text>
              </View>
            </View>
            <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
              <FontAwesome5 name="star" size={14} color={c.text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: c.text }]}>This is just the beginning!</Text>
                <Text style={[styles.infoText, { color: c.secondaryText }]}>Unlock your personalized plan, budget-aware shopping list and progress tracking.</Text>
              </View>
            </View>
          </View>
        )}

        {step === 12 && (
          <>
            <Text style={[styles.title, { color: c.text }]}>Here&apos;s what your plan includes</Text>
            <Text style={[styles.subtitle, { color: c.secondaryText }]}>Your personalized plan to reach {form.goal_weight_kg}kg.</Text>
            <View style={styles.form} lightColor="transparent" darkColor="transparent">
              <OptionCard icon={<FontAwesome5 name="bullseye" size={18} color={c.text} />} label="Calorie Tracking" description="Track effortlessly and stay on target" selected={false} onPress={() => {}} colors={c} />
              <OptionCard icon={<FontAwesome5 name="camera" size={18} color={c.text} />} label="Barcode Food Scanner" description="Scan products and get instant nutrition" selected={false} onPress={() => {}} colors={c} />
              <OptionCard icon={<FontAwesome5 name="shopping-basket" size={18} color={c.text} />} label="Budget-Aware Grocery Plan" description="Meals that fit what you actually spend" selected={false} onPress={() => {}} colors={c} />
              <OptionCard icon={<FontAwesome5 name="chart-line" size={18} color={c.text} />} label="Progress Tracking" description="Monitor your progress and stay motivated" selected={false} onPress={() => {}} colors={c} />
              <OptionCard icon={<FontAwesome5 name="bell" size={18} color={c.text} />} label="Smart Reminders" description="Meal reminders to keep you consistent" selected={false} onPress={() => {}} colors={c} />
            </View>
          </>
        )}

        {error && <Text style={[styles.errorText, { color: c.ringCalories }]}>{error}</Text>}

        <View style={styles.navRow} lightColor="transparent" darkColor="transparent">
          <Pressable
            onPress={handleNext}
            disabled={!canProceed || submitting}
            style={[styles.primaryButton, { backgroundColor: c.text, opacity: !canProceed || submitting ? 0.5 : 1 }]}
          >
            {submitting ? (
              <ActivityIndicator color={c.background} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: c.background }]}>
                {step === LAST_STEP ? 'Create my plan' : step >= 11 ? 'Continue' : step === 0 ? 'Get Started' : 'Next'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48, flexGrow: 1 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  progressRow: { flex: 1, flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },

  welcomeWrap: { flex: 1, alignItems: 'center', paddingTop: 40 },
  welcomeTitle: { fontSize: 30, fontWeight: '800', textAlign: 'center', marginTop: 32, lineHeight: 36 },
  welcomeSubtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 14, lineHeight: 20, paddingHorizontal: 12 },

  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '600', marginBottom: 24, lineHeight: 20 },
  sublabel: { fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: -2 },
  hintText: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  nameInput: { fontSize: 17, fontWeight: '700', borderWidth: 1.5, paddingVertical: 16 },
  form: { gap: 12 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
  stepperButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontFamily: 'SpaceMono', fontSize: 20, fontWeight: '700', minWidth: 24, textAlign: 'center' },

  resultIconWrap: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  resultValue: { fontFamily: 'SpaceMono', fontSize: 44, fontWeight: '700', letterSpacing: -1, marginTop: 24 },
  resultUnit: { fontSize: 13, fontWeight: '700', marginBottom: 24 },
  macroRow: { flexDirection: 'row', gap: 12, width: '100%' },
  macroChip: { flex: 1, alignItems: 'center', gap: 4, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 14 },
  macroValue: { fontFamily: 'SpaceMono', fontSize: 15, fontWeight: '700', marginTop: 2 },
  macroLabel: { fontSize: 11, fontWeight: '600' },
  infoCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 16, marginTop: 24, width: '100%',
  },
  infoTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  infoText: { fontSize: 12, fontWeight: '600', lineHeight: 17 },

  errorText: { fontSize: 13, fontWeight: '600', marginTop: 16 },
  navRow: { marginTop: 32 },
  primaryButton: { flexDirection: 'row', gap: 10, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
});
