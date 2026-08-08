import { StyleSheet, View as RNView } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { usePlan } from '@/context/PlanContext';
import { mealTotals, targets } from '@/constants/planData';

/**
 * A real (if limited) streak: 1 once today's calorie target is met, 0 otherwise.
 * There's no persisted per-day history yet - only today's totals are real - so this
 * can't count consecutive days honestly beyond "did today go well" until daily
 * records are stored server-side.
 */
export function StreakBadge() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { meals, catalog } = usePlan();

  const caloriesToday = meals
    .filter((m) => m.eaten)
    .reduce((sum, m) => sum + mealTotals(m.items, catalog).calories, 0);
  const streak = caloriesToday >= targets.calories * 0.9 ? 1 : 0;

  return (
    <RNView style={[styles.badge, { backgroundColor: c.card, borderColor: c.cardDivider, marginRight: 16 }]}>
      <FontAwesome5 name="fire" size={13} color={c.ringCalories} />
      <Text style={[styles.count, { color: c.text }]}>{streak}</Text>
    </RNView>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 6,
  },
  count: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700' },
});
