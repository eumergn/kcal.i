/**
 * DIRECTION CONTRACT (see DESIGN.md for the full record)
 * THESIS: this should feel like a futuristic personal instrument - a HUD readout,
 *   not a spreadsheet. Distinct per-macro ring colors (user's explicit preference,
 *   overriding an earlier single-accent-only pass).
 * OWN-WORLD: near-black surfaces, four rings (calories hero + protein/carbs/fat),
 *   each with its own accent color, monospace numerals, frosted-glass goal chip.
 *   No cost/budget on this screen at all - that lives in Grocery now.
 * FORM: dark + ring-based, the user's confirmed final call.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View as RNView,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { usePlan } from '@/context/PlanContext';
import { useSettings } from '@/context/SettingsContext';
import { Meal, mealTotals, targets } from '@/constants/planData';
import { accountCreatedAt } from '@/constants/account';
import { useTabSlide } from '@/components/useTabSlide';
import { ProgressRing } from '@/components/ProgressRing';
import { Entrance } from '@/components/Entrance';
import { startOfToday, buildWeekDays } from '@/lib/dates';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const WATER_STEP_LITERS = 0.25;

/** The earliest day the strip is allowed to reach - can't view history from before the account existed. */
const MIN_DAY_OFFSET = -Math.floor((startOfToday().getTime() - accountCreatedAt.getTime()) / 86400000);
const MIN_WEEK_OFFSET = Math.floor(MIN_DAY_OFFSET / 7);
const MAX_WEEK_OFFSET = 4; // a handful of weeks to plan ahead into

const WEEK_OFFSETS = Array.from({ length: MAX_WEEK_OFFSET - MIN_WEEK_OFFSET + 1 }, (_, i) => MIN_WEEK_OFFSET + i);
const CURRENT_WEEK_INDEX = WEEK_OFFSETS.indexOf(0);

const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTENT_PADDING = 20;
const PAGE_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;

/** "08:00" -> 480 (minutes since midnight), for comparing against the device clock. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * NEXT tracks the real clock, not just "first unmarked meal": once a meal's time has
 * passed and it's still unmarked, it becomes NEXT (you're "in" that meal's window) -
 * an overdue breakfast doesn't keep NEXT stuck there once lunchtime arrives. And once
 * the last meal's time has passed entirely, nothing is NEXT - the day's window is over.
 */
function computeNextMealId(meals: Meal[], nowMinutes: number): string | null {
  const sorted = [...meals].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const last = sorted[sorted.length - 1];
  if (!last || nowMinutes > timeToMinutes(last.time)) return null;

  const due = sorted.filter((m) => timeToMinutes(m.time) <= nowMinutes);
  const dueUneaten = due.filter((m) => !m.eaten);
  if (dueUneaten.length > 0) return dueUneaten[dueUneaten.length - 1].id; // most recent overdue meal

  const upcoming = sorted.find((m) => timeToMinutes(m.time) > nowMinutes && !m.eaten);
  return upcoming?.id ?? null;
}

/** The focal moment: a satisfying pop-in fill + checkmark - the one action this screen exists for. */
function MealCheckmark({ eaten, fillColor, ringColor }: { eaten: boolean; fillColor: string; ringColor: string }) {
  const anim = useRef(new Animated.Value(eaten ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: eaten ? 1 : 0, useNativeDriver: true, friction: 7, tension: 160 }).start();
  }, [eaten, anim]);

  return (
    <RNView style={[styles.checkCircle, { borderColor: ringColor }]}>
      <Animated.View
        style={[
          styles.checkFill,
          {
            backgroundColor: fillColor,
            opacity: anim,
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          },
        ]}
      >
        <FontAwesome name="check" size={13} color="#04110D" />
      </Animated.View>
    </RNView>
  );
}

/**
 * Two independent tap targets in one row: the time column opens the meal detail
 * (view/add/remove/modify ingredients), the rest of the row marks it eaten - kept as
 * separate Pressables rather than nesting them, to avoid ambiguous touch handling.
 */
function MealRow({
  meal,
  isNext,
  isFirst,
  colors,
  onPressEaten,
  onPressDetail,
}: {
  meal: Meal;
  isNext: boolean;
  isFirst: boolean;
  colors: (typeof Colors)['light'];
  onPressEaten: () => void;
  onPressDetail: () => void;
}) {
  const { catalog } = usePlan();
  const scale = useRef(new Animated.Value(1)).current;
  const totals = mealTotals(meal.items, catalog);
  const summary =
    meal.items
      .map((it) => catalog.find((f) => f.id === it.foodId)?.name)
      .filter((name): name is string => Boolean(name))
      .join(', ') || 'No ingredients yet';

  const pressIn = () => Animated.timing(scale, { toValue: 0.98, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 200 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPressDetail}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.mealRow, !isFirst && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardDivider }]}
        accessibilityRole="button"
        accessibilityLabel={`View, add, remove, or modify ingredients for ${meal.name}`}
      >
        <View style={styles.mealTimeCol} lightColor="transparent" darkColor="transparent">
          <Text style={[styles.mealTime, { color: colors.secondaryText }]}>{meal.time}</Text>
          {isNext && <Text style={[styles.nextTag, { color: colors.ringCalories }]}>NEXT</Text>}
        </View>

        <View style={styles.mealTextCol} lightColor="transparent" darkColor="transparent">
          <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
          <Text style={[styles.mealDescription, { color: colors.secondaryText }]} numberOfLines={1}>
            {summary}
          </Text>
          <Text style={[styles.mealMeta, { color: colors.secondaryText }]}>{Math.round(totals.calories)} kcal</Text>
        </View>

        {/* Nested Pressable: RN's responder system gives this touch priority over the
            row's own onPress, so tapping the checkmark toggles eaten instead of navigating. */}
        <Pressable
          onPress={onPressEaten}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${meal.name} as ${meal.eaten ? 'not eaten' : 'eaten'}`}
        >
          <MealCheckmark eaten={meal.eaten} fillColor={colors.success} ringColor={colors.cardDivider} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { meals, toggleEaten, catalog } = usePlan();
  const { waterGoalLiters } = useSettings();
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [litersToday, setLitersToday] = useState(0);
  const slideStyle = useTabSlide('index');
  const today = useMemo(() => startOfToday(), []);

  const handleWeekPageEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH);
    const clamped = Math.max(0, Math.min(WEEK_OFFSETS.length - 1, index));
    if (WEEK_OFFSETS[clamped] === 0) setSelectedOffset(0);
  };

  const totals = useMemo(() => {
    return meals
      .filter((m) => m.eaten)
      .reduce(
        (acc, m) => {
          const t = mealTotals(m.items, catalog);
          return {
            calories: acc.calories + t.calories,
            proteinG: acc.proteinG + t.proteinG,
            carbsG: acc.carbsG + t.carbsG,
            fatG: acc.fatG + t.fatG,
          };
        },
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      );
  }, [meals, catalog]);

  // Ticks every minute so NEXT reprioritizes against the real clock without needing
  // a reload - e.g. it should move off an overdue breakfast onto lunch right as
  // lunchtime arrives, not just whenever the screen happens to re-render.
  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Peak-moment glow: a brief pulse behind the hero ring whenever progress changes
  // (never on first mount) - celebrates the action without being gimmicky.
  const glowAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 550, easing: EASE_OUT, useNativeDriver: true }),
    ]).start();
  }, [totals.calories, totals.proteinG, totals.carbsG, totals.fatG, glowAnim]);

  const nextMealId = computeNextMealId(meals, nowMinutes);

  // Only today has a real tracked record - there's no persisted per-day history yet,
  // so any other selected day must show honest zeros instead of quietly repeating
  // today's numbers under a different date.
  const isToday = selectedOffset === 0;
  const displayTotals = isToday ? totals : { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  const handleToggleEaten = (meal: Meal) => {
    const summary = meal.items.map((it) => catalog.find((f) => f.id === it.foodId)?.name).filter(Boolean).join(', ');
    Alert.alert(
      meal.eaten ? 'Unmark this meal?' : 'Mark this meal as eaten?',
      `${meal.time} · ${summary}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: meal.eaten ? 'Unmark' : 'Mark eaten',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.create(250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
            toggleEaten(meal.id);
          },
        },
      ],
    );
  };

  return (
    <Animated.View style={[{ flex: 1 }, slideStyle]}>
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: PAGE_WIDTH, marginBottom: 24 }}
        contentOffset={{ x: CURRENT_WEEK_INDEX * PAGE_WIDTH, y: 0 }}
        onMomentumScrollEnd={handleWeekPageEnd}
      >
        {WEEK_OFFSETS.map((weekOffset) => (
          <View key={weekOffset} style={[styles.weekStrip, { width: PAGE_WIDTH }]} lightColor="transparent" darkColor="transparent">
            {buildWeekDays(today, weekOffset, MIN_DAY_OFFSET).map((day) => {
              const isSelected = day.offset === selectedOffset;
              const dayProgress = day.isToday ? Math.min(totals.calories / targets.calories, 1) : 0;
              return (
                <Pressable
                  key={day.offset}
                  onPress={() => day.enabled && setSelectedOffset(day.offset)}
                  disabled={!day.enabled}
                  style={[styles.dayCell, { opacity: day.enabled ? 1 : 0.3 }]}
                  accessibilityLabel={`${day.letter} ${day.dateNum}${day.isToday ? ', today' : ''}`}
                >
                  <Text style={[styles.dayLetter, { color: c.secondaryText }]}>{day.letter}</Text>
                  <ProgressRing
                    size={40}
                    strokeWidth={2}
                    progress={dayProgress}
                    color={isSelected ? c.text : c.ringTrack}
                    track={c.ringTrack}
                  >
                    <Text style={[styles.dayNum, { color: isSelected ? c.text : c.secondaryText }]}>{day.dateNum}</Text>
                  </ProgressRing>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Entrance>
        <View style={[styles.calorieCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <View style={styles.calorieTextCol} lightColor="transparent" darkColor="transparent">
            <Text style={styles.calorieValue}>
              <Text style={{ color: c.text }}>{Math.round(displayTotals.calories)}</Text>
              <Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.calories}kcal</Text>
            </Text>
            <Text style={[styles.calorieLabel, { color: c.secondaryText }]}>Calories taken</Text>
          </View>

          <View style={styles.calorieRingWrap} lightColor="transparent" darkColor="transparent">
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heroGlow,
                {
                  backgroundColor: c.ringCalories + '59', // ~35% opacity glow
                  opacity: glowAnim,
                  transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.05] }) }],
                },
              ]}
            />
            <ProgressRing size={68} strokeWidth={5} progress={displayTotals.calories / targets.calories} color={c.ringCalories} track={c.ringTrack}>
              <FontAwesome5 name="fire" size={20} color={c.ringCalories} />
            </ProgressRing>
          </View>
        </View>

        <View style={styles.secondaryRow} lightColor="transparent" darkColor="transparent">
          <View style={[styles.secondaryStat, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <ProgressRing size={64} strokeWidth={5} progress={displayTotals.proteinG / targets.proteinG} color={c.ringProtein} track={c.ringTrack}>
              <MaterialCommunityIcons name="food-drumstick" size={22} color={c.ringProtein} />
            </ProgressRing>
            <Text style={[styles.smallRingGrams, { color: c.text }]}>
              {Math.round(displayTotals.proteinG)}<Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.proteinG}g</Text>
            </Text>
            <Text style={[styles.secondaryLabel, { color: c.secondaryText }]}>Protein taken</Text>
          </View>
          <View style={[styles.secondaryStat, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <ProgressRing size={64} strokeWidth={5} progress={displayTotals.carbsG / targets.carbsG} color={c.ringCarbs} track={c.ringTrack}>
              <FontAwesome5 name="bread-slice" size={19} color={c.ringCarbs} />
            </ProgressRing>
            <Text style={[styles.smallRingGrams, { color: c.text }]}>
              {Math.round(displayTotals.carbsG)}<Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.carbsG}g</Text>
            </Text>
            <Text style={[styles.secondaryLabel, { color: c.secondaryText }]}>Carbs taken</Text>
          </View>
          <View style={[styles.secondaryStat, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <ProgressRing size={64} strokeWidth={5} progress={displayTotals.fatG / targets.fatG} color={c.ringFat} track={c.ringTrack}>
              <FontAwesome5 name="tint" size={19} color={c.ringFat} />
            </ProgressRing>
            <Text style={[styles.smallRingGrams, { color: c.text }]}>
              {Math.round(displayTotals.fatG)}<Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.fatG}g</Text>
            </Text>
            <Text style={[styles.secondaryLabel, { color: c.secondaryText }]}>Fat taken</Text>
          </View>
        </View>

        <View style={[styles.waterCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <ProgressRing size={48} strokeWidth={4} progress={litersToday / waterGoalLiters} color={c.ringCarbs} track={c.ringTrack}>
            <FontAwesome5 name="tint" size={16} color={c.ringCarbs} />
          </ProgressRing>
          <View style={{ flex: 1 }} lightColor="transparent" darkColor="transparent">
            <Text style={styles.waterValue}>
              <Text style={{ color: c.text }}>{litersToday.toFixed(2)}</Text>
              <Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{waterGoalLiters.toFixed(1)}L</Text>
            </Text>
            <Text style={[styles.secondaryLabel, { color: c.secondaryText, textAlign: 'left' }]}>Water taken</Text>
          </View>
          <RNView style={styles.waterButtons}>
            <Pressable
              onPress={() => setLitersToday((n) => Math.max(0, Math.round((n - WATER_STEP_LITERS) * 100) / 100))}
              disabled={litersToday <= 0}
              style={[styles.waterStepperButton, { backgroundColor: c.cardDivider, opacity: litersToday <= 0 ? 0.4 : 1 }]}
            >
              <FontAwesome name="minus" size={11} color={c.text} />
            </Pressable>
            <Pressable
              onPress={() => setLitersToday((n) => Math.round((n + WATER_STEP_LITERS) * 100) / 100)}
              style={[styles.waterStepperButton, { backgroundColor: c.cardDivider }]}
            >
              <FontAwesome name="plus" size={11} color={c.text} />
            </Pressable>
          </RNView>
        </View>
      </Entrance>

      <Entrance delay={90}>
        <Text style={[styles.sectionTitle, { color: c.text, marginBottom: isToday ? 16 : 4 }]}>{isToday ? "Today's meals" : 'Planned meals'}</Text>
        {!isToday && (
          <Text style={[styles.dayNote, { color: c.secondaryText }]}>
            Eaten tracking only applies to today - this day has no record yet.
          </Text>
        )}
        <View style={[styles.mealsCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          {meals.map((meal, i) => (
            <MealRow
              key={meal.id}
              meal={isToday ? meal : { ...meal, eaten: false }}
              isNext={isToday && meal.id === nextMealId}
              isFirst={i === 0}
              colors={c}
              onPressEaten={isToday ? () => handleToggleEaten(meal) : () => {}}
              onPressDetail={() => router.push({ pathname: '/meal/[id]', params: { id: meal.id } })}
            />
          ))}
        </View>
      </Entrance>
    </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 120 },

  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  dayCell: { alignItems: 'center', gap: 6 },
  dayLetter: { fontSize: 11, fontWeight: '600' },
  dayNum: { fontSize: 13, fontWeight: '700' },

  calorieCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 18, marginBottom: 16,
  },
  calorieTextCol: { flex: 1, gap: 4, paddingRight: 10 },
  calorieValue: { fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  calorieLabel: { fontSize: 12, fontWeight: '700' },
  calorieRingWrap: { alignItems: 'center', justifyContent: 'center' },
  heroGlow: { position: 'absolute', width: 84, height: 84, borderRadius: 42 },

  secondaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  secondaryStat: {
    flex: 1, alignItems: 'center', gap: 8,
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 16,
  },
  secondaryLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  smallRingGrams: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700' },

  waterCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12,
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 14,
  },
  waterValue: { fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '700' },
  waterButtons: { flexDirection: 'row', gap: 8 },
  waterStepperButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 40, marginBottom: 4 },
  dayNote: { fontSize: 12, fontWeight: '600', marginBottom: 16 },
  mealsCard: { borderRadius: 20, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 16, minHeight: 44 },
  mealTimeCol: { width: 48 },
  mealTime: { fontSize: 12, fontWeight: '600' },
  nextTag: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },
  mealTextCol: { flex: 1, gap: 4 },
  mealName: { fontSize: 15, fontWeight: '700' },
  mealDescription: { fontSize: 13, fontWeight: '600' },
  mealMeta: { fontSize: 12, fontWeight: '600' },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  checkFill: {
    position: 'absolute', top: -1.5, left: -1.5, right: -1.5, bottom: -1.5,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
});
