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
import { Alert, Animated, Easing, LayoutAnimation, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { usePlan } from '@/context/PlanContext';
import { Meal, mealTotals, targets } from '@/constants/planData';
import { accountCreatedAt } from '@/constants/account';
import { useTabSlide } from '@/components/useTabSlide';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  d.setDate(d.getDate() - day); // Sunday-start week, matching the reference strip
  return d;
}

/** The earliest day the strip is allowed to select - can't view history from before the account existed. */
const MIN_DAY_OFFSET = -Math.floor((startOfToday().getTime() - accountCreatedAt.getTime()) / 86400000);

type WeekDay = {
  offset: number;
  date: Date;
  letter: string;
  dateNum: number;
  isToday: boolean;
  enabled: boolean;
};

/**
 * The current Sun-Sat week, one cell per day. Only "today" (offset 0) has real
 * tracked data - one sample day, no backend yet - so every other cell's ring stays
 * an empty track rather than showing a fabricated completion percentage.
 */
function buildWeekDays(today: Date): WeekDay[] {
  const weekStart = startOfWeek(today);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const offset = Math.round((date.getTime() - today.getTime()) / 86400000);
    return {
      offset,
      date,
      letter: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: date.getDate(),
      isToday: offset === 0,
      enabled: offset >= MIN_DAY_OFFSET,
    };
  });
}

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

/** The primary device of this world: an animated ring, not a bar. */
function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  track,
  children,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  track: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(Math.min(progress, 1))).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(progress, 1), duration: 500, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [progress, anim]);

  const strokeDashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <RNView style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <RNView style={StyleSheet.absoluteFillObject}>
        <RNView style={styles.ringCenter}>{children}</RNView>
      </RNView>
    </RNView>
  );
}

/** One authored entrance moment: content rises and fades in on open, instead of a static snap-in. */
function Entrance({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 420, delay, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
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
  const [selectedOffset, setSelectedOffset] = useState(0);
  const isCurrentDay = selectedOffset === 0;
  const slideStyle = useTabSlide('index');

  const weekDays = useMemo(() => buildWeekDays(startOfToday()), []);

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
      <View style={styles.weekStrip} lightColor="transparent" darkColor="transparent">
        {weekDays.map((day) => {
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

      {!isCurrentDay && (
        <View style={[styles.emptyStateCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <FontAwesome name="calendar-o" size={26} color={c.secondaryText} />
          <Text style={[styles.emptyStateTitle, { color: c.text }]}>No data for this day</Text>
          <Text style={[styles.emptyStateSubtitle, { color: c.secondaryText }]}>
            Historical and future days will show up here once there&apos;s real tracked data to look back on.
          </Text>
          <Pressable onPress={() => setSelectedOffset(0)} style={[styles.backToTodayButton, { backgroundColor: c.cardDivider }]}>
            <Text style={[styles.backToTodayText, { color: c.text }]}>Back to today</Text>
          </Pressable>
        </View>
      )}

      {isCurrentDay && (
      <>
      <Entrance>
        <View style={[styles.calorieCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          <View style={styles.calorieTextCol} lightColor="transparent" darkColor="transparent">
            <Text style={styles.calorieValue}>
              <Text style={{ color: c.text }}>{Math.round(totals.calories)}</Text>
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
            <ProgressRing size={88} strokeWidth={6} progress={totals.calories / targets.calories} color={c.ringCalories} track={c.ringTrack}>
              <FontAwesome5 name="fire" size={26} color={c.ringCalories} />
            </ProgressRing>
          </View>
        </View>

        <View style={styles.secondaryRow} lightColor="transparent" darkColor="transparent">
          <View style={[styles.secondaryStat, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <ProgressRing size={64} strokeWidth={5} progress={totals.proteinG / targets.proteinG} color={c.ringProtein} track={c.ringTrack}>
              <MaterialCommunityIcons name="food-drumstick" size={22} color={c.ringProtein} />
            </ProgressRing>
            <Text style={[styles.smallRingGrams, { color: c.text }]}>
              {Math.round(totals.proteinG)}<Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.proteinG}g</Text>
            </Text>
            <Text style={[styles.secondaryLabel, { color: c.secondaryText }]}>Protein taken</Text>
          </View>
          <View style={[styles.secondaryStat, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <ProgressRing size={64} strokeWidth={5} progress={totals.carbsG / targets.carbsG} color={c.ringCarbs} track={c.ringTrack}>
              <FontAwesome5 name="bread-slice" size={19} color={c.ringCarbs} />
            </ProgressRing>
            <Text style={[styles.smallRingGrams, { color: c.text }]}>
              {Math.round(totals.carbsG)}<Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.carbsG}g</Text>
            </Text>
            <Text style={[styles.secondaryLabel, { color: c.secondaryText }]}>Carbs taken</Text>
          </View>
          <View style={[styles.secondaryStat, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
            <ProgressRing size={64} strokeWidth={5} progress={totals.fatG / targets.fatG} color={c.ringFat} track={c.ringTrack}>
              <FontAwesome5 name="tint" size={19} color={c.ringFat} />
            </ProgressRing>
            <Text style={[styles.smallRingGrams, { color: c.text }]}>
              {Math.round(totals.fatG)}<Text style={{ color: c.secondaryText, fontWeight: '600' }}>/{targets.fatG}g</Text>
            </Text>
            <Text style={[styles.secondaryLabel, { color: c.secondaryText }]}>Fat taken</Text>
          </View>
        </View>
      </Entrance>

      <Entrance delay={90}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Today&apos;s meals</Text>
        <View style={[styles.mealsCard, { backgroundColor: c.card, borderColor: c.cardDivider }]}>
          {meals.map((meal, i) => (
            <MealRow
              key={meal.id}
              meal={meal}
              isNext={meal.id === nextMealId}
              isFirst={i === 0}
              colors={c}
              onPressEaten={() => handleToggleEaten(meal)}
              onPressDetail={() => router.push({ pathname: '/meal/[id]', params: { id: meal.id } })}
            />
          ))}
        </View>
      </Entrance>
      </>
      )}
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

  emptyStateCard: { borderRadius: 22, padding: 28, alignItems: 'center', gap: 10, borderWidth: StyleSheet.hairlineWidth },
  emptyStateTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyStateSubtitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },
  backToTodayButton: { borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  backToTodayText: { fontSize: 13, fontWeight: '700' },

  calorieCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 24, marginBottom: 16,
  },
  calorieTextCol: { flex: 1, gap: 6, paddingRight: 12 },
  calorieValue: { fontFamily: 'SpaceMono', fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  calorieLabel: { fontSize: 14, fontWeight: '700' },
  calorieRingWrap: { alignItems: 'center', justifyContent: 'center' },
  heroGlow: { position: 'absolute', width: 108, height: 108, borderRadius: 54 },
  ringCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  secondaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  secondaryStat: {
    flex: 1, alignItems: 'center', gap: 8,
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 16,
  },
  secondaryLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  smallRingGrams: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700' },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 40, marginBottom: 16 },
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
